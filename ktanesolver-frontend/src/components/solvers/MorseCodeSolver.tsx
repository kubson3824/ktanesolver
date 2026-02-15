import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveMorse, type MorseOutput, type MorseCandidate } from "../../services/morseService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { useRoundStore } from "../../store/useRoundStore";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";

interface MorseCodeSolverProps {
  bomb: BombEntity | null | undefined;
}

// Morse code to letter mapping
const MORSE_TO_LETTER: Record<string, string> = {
  '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F',
  '--.': 'G', '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L',
  '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R',
  '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
  '-.--': 'Y', '--..': 'Z'
};

// Letter to Morse code mapping (for display)
const LETTER_TO_MORSE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..'
};

// Display Morse pattern with readable symbols (· = dot, − = dash)
function formatMorseForDisplay(morse: string): string {
  return morse.replace(/\./g, "·").replace(/-/g, "−");
}


export default function MorseCodeSolver({ bomb }: MorseCodeSolverProps) {
  const [morseInput, setMorseInput] = useState<string>("");
  const [translatedWord, setTranslatedWord] = useState<string>("");
  const [result, setResult] = useState<MorseOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  /** Skip clearing result for the next N runs of the [morseInput] effect (restore triggers 2 runs: before and after input is applied). */
  const skipClearResultCountRef = useRef(0);

  // Use the common solver hook for shared state
  const {
    isLoading,
    error,
    setIsLoading,
    setError,
    setIsSolved,
    clearError,
    reset: resetSolverState,
    currentModule,
    round,
    markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);

  const moduleState = useMemo(
    () => ({ morseInput, translatedWord, result, twitchCommand }),
    [morseInput, translatedWord, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      morseInput?: string;
      translatedWord?: string;
      result?: MorseOutput | null;
      twitchCommand?: string;
      input?: { word?: string };
    }) => {
      skipClearResultCountRef.current = 2;
      // Prefer backend shape so reload displays what the user had input
      if (state.input?.word !== undefined && state.input.word !== "") {
        const word = state.input.word.toUpperCase();
        setTranslatedWord(word);
        const morse = word
          .split("")
          .map((c) => LETTER_TO_MORSE[c])
          .filter(Boolean)
          .join(" ");
        setMorseInput(morse);
      } else {
        if (state.morseInput !== undefined) setMorseInput(state.morseInput);
        if (state.translatedWord !== undefined) setTranslatedWord(state.translatedWord);
      }
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: MorseOutput) => {
      if (!solution || !Array.isArray(solution.candidates)) return;
      skipClearResultCountRef.current = 2;
      setResult(solution);

      if (solution.candidates.length > 0) {
        const bestCandidate = solution.candidates.reduce((prev, current) =>
          prev.confidence > current.confidence ? prev : current,
        );
        const command = generateTwitchCommand({
          moduleType: ModuleType.MORSE_CODE,
          result: { word: bestCandidate.word },
        });
        setTwitchCommand(command);
      }
    },
  []);

  useSolverModulePersistence<
    { morseInput: string; translatedWord: string; result: MorseOutput | null; twitchCommand: string },
    MorseOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    onBeforeRestore: () => {
      skipClearResultCountRef.current = 2;
    },
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; result?: unknown; candidates?: unknown };
        const candidate = anyRaw.output ?? anyRaw.result ?? raw;
        const obj = (typeof candidate === "object" && candidate !== null ? candidate : raw) as MorseOutput;
        if (!Array.isArray(obj?.candidates)) return null;
        return obj;
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  // Translate Morse code to letters
  const translateMorseToWord = (morse: string): string => {
    if (!morse.trim()) return "";
    
    // Split by spaces (letter separator)
    const letterCodes = morse.trim().split(/\s+/).filter(code => code.length > 0);
    const letters = letterCodes.map(code => {
      return MORSE_TO_LETTER[code] || '?';
    });
    
    return letters.join('');
  };

  // Play Morse code sound for the current input
  const playMorseCode = async () => {
    if (!morseInput || isPlaying) return;
    
    setIsPlaying(true);
    const dotDuration = 150; // milliseconds
    const dashDuration = dotDuration * 3;
    const frequency = 600; // Hz

    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    try {
      // Parse the morse input
      const letterCodes = morseInput.trim().split(/\s+/).filter(code => code.length > 0);
      
      for (let i = 0; i < letterCodes.length; i++) {
        const letterCode = letterCodes[i];
        
        // Play each symbol in the letter
        for (const symbol of letterCode) {
          if (symbol === '.' || symbol === '-') {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            const duration = symbol === '.' ? dotDuration : dashDuration;
            gainNode.gain.value = 0.3;
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + duration / 1000);
            
            await new Promise(resolve => setTimeout(resolve, duration + dotDuration));
          }
        }
        
        // Extra pause between letters
        if (i < letterCodes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, dotDuration * 3));
        }
      }
    } finally {
      // Clean up audio context
      await audioContext.close();
      setIsPlaying(false);
    }
  };

  // Update translated word whenever morse input changes (don't clear result/twitch when this change was from restore).
  // clearError is only invoked here, not depended on — dependency is morseInput only so we don't re-run every render.
  useEffect(() => {
    const translated = translateMorseToWord(morseInput);
    setTranslatedWord(translated);
    if (skipClearResultCountRef.current > 0) {
      skipClearResultCountRef.current -= 1;
    } else {
      setResult(null);
      clearError();
      setTwitchCommand("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- effect intentionally runs only when morseInput changes
  }, [morseInput]);

  const handleMorseInput = (value: string) => {
    // Only allow dots, dashes, and spaces
    const filtered = value.replace(/[^\.\-\s]/g, '');
    setMorseInput(filtered);
  };


  const clearInput = () => {
    setMorseInput("");
  };

  const solveMorseCode = async () => {
    if (!translatedWord || translatedWord.includes('?')) {
      setError("Invalid Morse code. Please check your input.");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveMorse(round.id, bomb.id, currentModule.id, {
        input: { word: translatedWord }
      });

      const output = response?.output;
      if (!output || !Array.isArray(output.candidates)) {
        setError("Invalid response from server");
        return;
      }

      setResult(output);

      // Show Twitch command for best candidate (resolved or suggested when unresolved)
      if (output.candidates.length > 0) {
        const bestCandidate = output.candidates.reduce((prev, current) =>
          prev.confidence > current.confidence ? prev : current
        );
        const command = generateTwitchCommand({
          moduleType: ModuleType.MORSE_CODE,
          result: { word: bestCandidate.word },
        });
        setTwitchCommand(command);
      } else {
        setTwitchCommand("");
      }

      // Mark module as solved only when backend is confident (score ≥ 0.85, clear winner)
      if (output.resolved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
      }

      // Persist state and solution to the round store so returning to this module shows the solution
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { input: { word: translatedWord } },
        { candidates: output.candidates, resolved: output.resolved },
        output.resolved
      );

      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Morse Code");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setMorseInput("");
    setTranslatedWord("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
      {/* Morse Code Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">MORSE CODE MODULE</h3>
        
        {/* Display area */}
        <div className="bg-black rounded-lg p-4 mb-4 min-h-[120px] flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Morse Input:</div>
            <div className="text-2xl font-mono text-green-400 mb-3 min-h-[30px]">
              {morseInput || <span className="text-gray-500">Enter Morse code...</span>}
            </div>
            <div className="text-sm text-gray-400 mb-2">Translation:</div>
            <div className="text-4xl font-mono font-bold text-green-300">
              {translatedWord || <span className="text-gray-500">?</span>}
            </div>
            <button
              onClick={playMorseCode}
              disabled={isPlaying || !morseInput}
              className="mt-3 btn btn-sm btn-outline btn-success"
            >
              {isPlaying ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Playing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  Play Sound
                </>
              )}
            </button>
          </div>
        </div>

        {/* Text input */}
        <div className="mb-4">
          <input
            type="text"
            value={morseInput}
            onChange={(e) => handleMorseInput(e.target.value)}
            placeholder="Enter Morse code (· · · - -)"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-lg focus:outline-none focus:border-primary"
            disabled={isLoading || (result?.resolved)}
          />
        </div>

      </div>

      {/* Morse code reference */}
      <div className="bg-base-200 rounded-lg p-3 mb-4">
        <h4 className="text-sm font-medium text-base-content mb-1.5">
          Morse Code Reference <span className="text-base-content/70 font-normal">(· = dot, − = dash)</span>
        </h4>
        <div className="overflow-x-auto">
          <table className="table table-zebra table-sm text-xs font-mono w-full">
            <thead>
              <tr>
                <th className="text-base-content font-semibold py-1 px-2">Letter</th>
                <th className="text-base-content font-semibold py-1 px-2">Morse</th>
                <th className="text-base-content font-semibold py-1 px-2">Letter</th>
                <th className="text-base-content font-semibold py-1 px-2">Morse</th>
                <th className="text-base-content font-semibold py-1 px-2">Letter</th>
                <th className="text-base-content font-semibold py-1 px-2">Morse</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const entries = Object.entries(LETTER_TO_MORSE);
                const rows: [string, string][][] = [];
                for (let i = 0; i < entries.length; i += 3) {
                  rows.push(entries.slice(i, i + 3));
                }
                return rows.map((row, i) => (
                  <tr key={i}>
                    {row.flatMap(([letter, morse]) => [
                      <td key={`${letter}-l`} className="font-semibold text-base-content py-0.5 px-2 w-8">{letter}</td>,
                      <td key={`${letter}-m`} className="text-base-content/90 tracking-wide py-0.5 px-2">{formatMorseForDisplay(morse)}</td>,
                    ])}
                    {row.length < 3 && Array.from({ length: (3 - row.length) * 2 }, (_, j) => <td key={`e-${j}`} className="py-0.5 px-2" />)}
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-base-content/60">Space between letters; no space between dots/dashes.</p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={solveMorseCode}
          className="btn btn-primary flex-1"
          disabled={
            !translatedWord ||
            translatedWord.includes("?") ||
            isLoading ||
            !round?.id ||
            !bomb?.id ||
            !currentModule?.id
          }
        >
          {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
          {isLoading ? "Solving..." : "Solve"}
        </button>
        <button onClick={clearInput} className="btn btn-outline" disabled={isLoading || (result?.resolved)}>
          Clear
        </button>
        <button onClick={reset} className="btn btn-outline" disabled={isLoading || (result?.resolved)}>
          Reset
        </button>
      </div>

      {/* Error display */}
      <ErrorAlert error={error} />

      {/* Results */}
      {result && (
        <div ref={resultsRef} className={`alert mb-4 ${result.resolved ? "alert-success" : "alert-warning"}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            {result.resolved ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            )}
          </svg>
          <div>
            {result.resolved && (result.candidates?.length ?? 0) > 0 ? (
              <div>
                <span className="font-bold">Word identified!</span>
                <div className="mt-2 flex items-center gap-3">
                  <span className="font-mono text-2xl">{result.candidates[0].word}</span>
                  <span className="text-sm opacity-70">
                    {result.candidates[0].frequency.toFixed(3)} MHz
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <span className="font-bold">Possible matches:</span>
                <div className="mt-2 space-y-1">
                  {(result.candidates ?? []).slice(0, 3).map((candidate: MorseCandidate, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="font-mono text-lg">{candidate.word}</span>
                      <span className="text-sm opacity-70">
                        ({Math.round(candidate.confidence * 100)}% confidence)
                      </span>
                      <span className="text-sm opacity-60">
                        {candidate.frequency.toFixed(3)} MHz
                      </span>
                      {index === 0 && (
                        <span className="text-xs bg-success/20 text-success px-2 py-1 rounded">
                          Most likely
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Twitch command display */}
      <TwitchCommandDisplay command={twitchCommand} />

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Type or use buttons to input the Morse code you see/hear.</p>
        <p>• Dot (·) = short signal</p>
        <p>• Dash (-) = long signal (3x longer)</p>
        <p>• Space = between letters</p>
        <p>• No spaces needed between dots/dashes</p>
      </div>
    </SolverLayout>
  );
}
