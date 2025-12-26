import { useState, useEffect } from "react";
import type { BombEntity } from "../types";
import { ModuleType } from "../types";
import { solveMorse, type MorseOutput, type MorseCandidate } from "../services/morseService";
import { useRoundStore } from "../store/useRoundStore";
import { generateTwitchCommand } from "../utils/twitchCommands";
import ModuleNumberInput from "./ModuleNumberInput";

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

// Possible words in Morse Code module
const MORSE_WORDS = [
  "SHELL", "HALLS", "SLICK", "TRICK", "BOXES", "LEAKS", 
  "STROBE", "BISTRO", "FLICK", "BOMBS", "BREAK", "BRICK", 
  "STEAK", "STING", "VECTOR", "BEATS"
];

export default function MorseCodeSolver({ bomb }: MorseCodeSolverProps) {
  const [morseInput, setMorseInput] = useState<string>("");
  const [translatedWord, setTranslatedWord] = useState<string>("");
  const [result, setResult] = useState<MorseOutput | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

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

  // Update translated word whenever morse input changes
  useEffect(() => {
    const translated = translateMorseToWord(morseInput);
    setTranslatedWord(translated);
    setIsSolved(false);
    setResult(null);
    setError("");
    setTwitchCommand("");
  }, [morseInput]);

  const handleMorseInput = (value: string) => {
    // Only allow dots, dashes, and spaces
    const filtered = value.replace(/[^\.\-\s]/g, '');
    setMorseInput(filtered);
  };

  const handleDot = () => {
    setMorseInput(prev => prev + '.');
  };

  const handleDash = () => {
    setMorseInput(prev => prev + '-');
  };

  const handleSpace = () => {
    setMorseInput(prev => prev + ' ');
  };

  const handleLetterSpace = () => {
    setMorseInput(prev => prev + ' ');
  };

  const handleBackspace = () => {
    setMorseInput(prev => prev.slice(0, -1));
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
    setError("");

    try {
      const response = await solveMorse(round.id, bomb.id, currentModule.id, {
        input: { word: translatedWord }
      });
      
      setResult(response.output);
      setIsSolved(true);
      
      // Generate Twitch command for the highest confidence candidate
      if (response.output.candidates.length > 0) {
        const bestCandidate = response.output.candidates.reduce((prev, current) => 
          prev.confidence > current.confidence ? prev : current
        );
        
        const command = generateTwitchCommand({
          moduleType: ModuleType.MORSE_CODE,
          result: { word: bestCandidate.word },
          moduleNumber
        });
        setTwitchCommand(command);
      }
      
      // Mark module as solved if resolved
      if (response.output.resolved) {
        markModuleSolved(bomb.id, currentModule.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve morse code");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setMorseInput("");
    setTranslatedWord("");
    setResult(null);
    setIsSolved(false);
    setError("");
    setTwitchCommand("");
  };

  return (
    <div className="w-full">
      <ModuleNumberInput />
      
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
      <div className="bg-base-200 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium text-base-content/70 mb-2">Morse Code Reference:</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs font-mono">
          {Object.entries(LETTER_TO_MORSE).map(([letter, morse]) => (
            <div key={letter} className="flex justify-between">
              <span className="text-base-content/60">{letter}:</span>
              <span className="text-base-content/80 ml-2">{morse}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-base-content/60">
          <p>• Use space between letters</p>
          <p>• No spaces needed between dots/dashes</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={solveMorseCode}
          className="btn btn-primary flex-1"
          disabled={!translatedWord || translatedWord.includes('?') || isLoading}
        >
          {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
          {isLoading ? "Solving..." : "Translate"}
        </button>
        <button onClick={clearInput} className="btn btn-outline" disabled={isLoading || (result?.resolved)}>
          Clear
        </button>
        <button onClick={reset} className="btn btn-outline" disabled={isLoading || (result?.resolved)}>
          Reset
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className={`alert mb-4 ${result.resolved ? "alert-success" : "alert-warning"}`}>
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
            {result.resolved ? (
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
                  {result.candidates.slice(0, 3).map((candidate: MorseCandidate, index: number) => (
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

      {/* Twitch Command */}
      {twitchCommand && result && (
        <div className="bg-purple-900/20 border border-purple-500 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-purple-400 mb-1">Twitch Chat Command:</h4>
              <code className="text-lg font-mono text-purple-200">{twitchCommand}</code>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(twitchCommand);
              }}
              className="btn btn-sm btn-outline btn-purple"
              title="Copy to clipboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Type or use buttons to input the Morse code you see/hear.</p>
        <p>• Dot (·) = short signal</p>
        <p>• Dash (-) = long signal (3x longer)</p>
        <p>• Space = between letters</p>
        <p>• No spaces needed between dots/dashes</p>
      </div>
    </div>
  );
}
