import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Play, Radio } from "lucide-react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import {
  solveMorse,
  type MorseOutput,
  type MorseCandidate,
} from "../../services/morseService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { useRoundStore } from "../../store/useRoundStore";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "../../lib/cn";

interface MorseCodeSolverProps {
  bomb: BombEntity | null | undefined;
}

const MORSE_TO_LETTER: Record<string, string> = {
  ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E", "..-.": "F",
  "--.": "G", "....": "H", "..": "I", ".---": "J", "-.-": "K", ".-..": "L",
  "--": "M", "-.": "N", "---": "O", ".--.": "P", "--.-": "Q", ".-.": "R",
  "...": "S", "-": "T", "..-": "U", "...-": "V", ".--": "W", "-..-": "X",
  "-.--": "Y", "--..": "Z",
};

const LETTER_TO_MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
  G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
  M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
};

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
  const skipClearResultCountRef = useRef(0);

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

  const onRestoreSolution = useCallback((solution: MorseOutput) => {
    if (!solution || !Array.isArray(solution.candidates)) return;
    skipClearResultCountRef.current = 2;
    setResult(solution);
    if (solution.candidates.length > 0) {
      const best = solution.candidates.reduce((p, c) =>
        p.confidence > c.confidence ? p : c,
      );
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.MORSE_CODE,
          result: { word: best.word },
        }),
      );
    }
  }, []);

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
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const translateMorseToWord = (morse: string): string => {
    if (!morse.trim()) return "";
    return morse
      .trim()
      .split(/\s+/)
      .filter((c) => c.length > 0)
      .map((c) => MORSE_TO_LETTER[c] || "?")
      .join("");
  };

  const playMorseCode = async () => {
    if (!morseInput || isPlaying) return;
    setIsPlaying(true);
    const dotDuration = 150;
    const dashDuration = dotDuration * 3;
    const frequency = 600;
    const ac =
      window.AudioContext ??
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!ac) {
      setError("Audio playback is not supported in this browser.");
      setIsPlaying(false);
      return;
    }
    const audioContext = new ac();
    try {
      const letterCodes = morseInput.trim().split(/\s+/).filter((c) => c.length > 0);
      for (let i = 0; i < letterCodes.length; i++) {
        for (const symbol of letterCodes[i]) {
          if (symbol === "." || symbol === "-") {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = frequency;
            osc.type = "sine";
            const duration = symbol === "." ? dotDuration : dashDuration;
            gain.gain.value = 0.3;
            osc.start();
            osc.stop(audioContext.currentTime + duration / 1000);
            await new Promise((r) => setTimeout(r, duration + dotDuration));
          }
        }
        if (i < letterCodes.length - 1) {
          await new Promise((r) => setTimeout(r, dotDuration * 3));
        }
      }
    } finally {
      await audioContext.close();
      setIsPlaying(false);
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [morseInput]);

  const handleMorseInput = (value: string) => {
    setMorseInput(value.replace(/[^.\s-]/g, ""));
  };

  const solveMorseCode = async () => {
    if (!translatedWord || translatedWord.includes("?")) {
      setError("Invalid Morse code. Check the dots/dashes above.");
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
        input: { word: translatedWord },
      });
      const output = response?.output;
      if (!output || !Array.isArray(output.candidates)) {
        setError("Invalid response from server");
        return;
      }
      setResult(output);
      if (output.candidates.length > 0) {
        const best = output.candidates.reduce((p, c) =>
          p.confidence > c.confidence ? p : c,
        );
        setTwitchCommand(
          generateTwitchCommand({
            moduleType: ModuleType.MORSE_CODE,
            result: { word: best.word },
          }),
        );
      } else {
        setTwitchCommand("");
      }
      if (output.resolved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
      }
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { input: { word: translatedWord } },
        { candidates: output.candidates, resolved: output.resolved },
        output.resolved,
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

  const morseEntries = Object.entries(LETTER_TO_MORSE);

  return (
    <SolverLayout>
      <SolverSection
        title="Morse input"
        description="Type the dots (.) and dashes (-) you see flashing. Put spaces between letters."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={playMorseCode}
            disabled={isPlaying || !morseInput}
          >
            {isPlaying ? (
              <>
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden />
                Playing
              </>
            ) : (
              <>
                <Play className="mr-1 h-3.5 w-3.5" aria-hidden /> Play
              </>
            )}
          </Button>
        }
      >
        <div className="mb-3 rounded-lg border border-border bg-muted/60 p-4 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Pattern
          </div>
          <div className="mt-1 min-h-[32px] font-mono text-2xl text-emerald-600 dark:text-emerald-400">
            {morseInput ? formatMorseForDisplay(morseInput) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          <div className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Translation
          </div>
          <div className="mt-1 font-mono text-3xl font-bold tracking-widest text-foreground">
            {translatedWord ? (
              <span className={cn(translatedWord.includes("?") && "text-amber-500")}>
                {translatedWord}
              </span>
            ) : (
              <span className="text-muted-foreground">?</span>
            )}
          </div>
        </div>

        <Input
          type="text"
          value={morseInput}
          onChange={(e) => handleMorseInput(e.target.value)}
          placeholder=". ... --- .-."
          className="font-mono text-base"
          disabled={isLoading || result?.resolved}
          aria-label="Morse code input"
        />
      </SolverSection>

      <SolverControls
        onSolve={solveMorseCode}
        onReset={reset}
        isSolveDisabled={!translatedWord || translatedWord.includes("?")}
        isLoading={isLoading}
        isSolved={Boolean(result?.resolved)}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result && (
        <Alert
          ref={resultsRef}
          variant={result.resolved ? "success" : "warning"}
          className="flex items-start gap-2"
        >
          <Radio className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            {result.resolved && (result.candidates?.length ?? 0) > 0 ? (
              <div>
                <p className="font-semibold">Word identified</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold">
                    {result.candidates[0].word}
                  </span>
                  <span className="text-xs opacity-70">
                    {result.candidates[0].frequency.toFixed(3)} MHz
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-semibold">Possible matches</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {(result.candidates ?? []).slice(0, 3).map((c: MorseCandidate, i: number) => (
                    <li key={i} className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-semibold">{c.word}</span>
                      <span className="text-xs opacity-70">
                        {Math.round(c.confidence * 100)}% conf.
                      </span>
                      <span className="text-xs opacity-60">
                        {c.frequency.toFixed(3)} MHz
                      </span>
                      {i === 0 && (
                        <span className="rounded-full bg-emerald-600/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                          Most likely
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Alert>
      )}

      <TwitchCommandDisplay command={twitchCommand} />

      <SolverSection title="Reference" description="Letter → Morse (· = dot, − = dash)">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 md:grid-cols-4">
          {morseEntries.map(([letter, morse]) => (
            <div
              key={letter}
              className="flex items-center justify-between gap-2 rounded border border-transparent px-1.5 py-0.5 font-mono text-xs hover:border-border hover:bg-muted/60"
            >
              <span className="font-semibold text-foreground">{letter}</span>
              <span className="tracking-widest text-muted-foreground">
                {formatMorseForDisplay(morse)}
              </span>
            </div>
          ))}
        </div>
      </SolverSection>

      <SolverInstructions>
        Use a space between letters; no space between symbols within a letter.
        Each word on the module corresponds to a transmitter frequency — the
        solver returns the frequency you need to dial in.
      </SolverInstructions>
    </SolverLayout>
  );
}
