import { useCallback, useMemo, useState } from "react";
import { Radio } from "lucide-react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveMorsematics as solveMorsematicsApi } from "../../services/morsematicsService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
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
import { Input } from "../ui/input";

interface MorsematicsSolverProps {
  bomb: BombEntity | null | undefined;
}

const MORSE_CODE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
  G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
  M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
};

const MORSE_TO_LETTER = Object.fromEntries(
  Object.entries(MORSE_CODE).map(([letter, morse]) => [morse, letter]),
) as Record<string, string>;

// eslint-disable-next-line react-refresh/only-export-components
export function decodeMorse(morse: string): string {
  return morse.trim().split(/\s+/).filter(Boolean).map((code) => MORSE_TO_LETTER[code] ?? "?").join("");
}

function formatMorse(morse: string): string {
  return morse.replace(/\./g, "·").replace(/-/g, "−");
}

function MorsePatternCard({ morse }: { morse: string }) {
  const letter = MORSE_TO_LETTER[morse] ?? "?";
  return (
    <div className="inline-flex min-w-[72px] flex-col items-center rounded-md border border-border bg-muted/40 px-3 py-2">
      <span className="font-mono text-2xl font-bold text-foreground">{letter}</span>
      <span className="mt-1 font-mono text-base tracking-widest text-emerald-600 dark:text-emerald-400">
        {morse ? formatMorse(morse) : "?"}
      </span>
    </div>
  );
}

export default function MorsematicsSolver({ bomb }: MorsematicsSolverProps) {
  const [morseInput, setMorseInput] = useState("");
  const [result, setResult] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const {
    isLoading,
    error,
    isSolved,
    setIsLoading,
    setError,
    setIsSolved,
    clearError,
    reset: resetSolverState,
    currentModule,
    round,
    markModuleSolved,
  } = useSolver();

  const letters = useMemo(() => decodeMorse(morseInput), [morseInput]);
  const moduleState = useMemo(() => ({ morseInput, letters, result, twitchCommand }), [morseInput, letters, result, twitchCommand]);

  const onRestoreState = useCallback(
    (state: { morseInput?: string; letters?: string; result?: string; twitchCommand?: string }) => {
      if (state.morseInput !== undefined) setMorseInput(state.morseInput);
      else if (state.letters) setMorseInput(state.letters.toUpperCase().split("").map((letter) => MORSE_CODE[letter]).join(" "));
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: { letter: string }) => {
    if (!solution?.letter) return;
    setResult(solution.letter);
    const command = generateTwitchCommand({
      moduleType: ModuleType.MORSEMATICS,
      result: solution,
    });
    setTwitchCommand(command);
  }, []);

  useSolverModulePersistence<
    { morseInput: string; letters: string; result: string; twitchCommand: string },
    { letter: string }
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; letter?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object")
          return anyRaw.output as { letter: string };
        if (typeof anyRaw.letter === "string") return { letter: anyRaw.letter };
      }
      return null;
    },
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSolve = async () => {
    if (morseInput.trim().split(/\s+/).length !== 3 || letters.includes("?")) {
      setError("Enter exactly 3 valid Morse patterns, separated by spaces");
      return;
    }
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveMorsematicsApi(round.id, bomb.id, currentModule.id, {
        input: { letters: letters.toUpperCase() },
      });

      setResult(response.output.letter);
      const command = generateTwitchCommand({
        moduleType: ModuleType.MORSEMATICS,
        result: response.output,
      });
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Morsematics");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMorseChange = (value: string) => {
    setMorseInput(value.replace(/[^.\s-]/g, "").replace(/\s+/g, " "));
    if (isSolved) {
      setResult("");
      setTwitchCommand("");
    }
  };

  const reset = () => {
    setMorseInput("");
    setResult("");
    setTwitchCommand("");
    resetSolverState();
  };

  const disabled = isLoading || isSolved;
  const morsePatterns = morseInput.trim().split(/\s+/).filter(Boolean);
  const validInput = morsePatterns.length === 3 && !letters.includes("?");

  return (
    <SolverLayout>
      <SolverSection
        title="Received Morse"
        description="Enter dots (.) and dashes (-) as they flash, with a space between each of the 3 letters."
      >
        <Input
          type="text"
          value={morseInput}
          onChange={(e) => handleMorseChange(e.target.value)}
          placeholder=".- -... -.-."
          disabled={disabled}
          aria-label="Received Morse code"
          className="text-center font-mono text-xl tracking-widest"
        />

        {morsePatterns.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {morsePatterns.map((morse, index) => (
              <MorsePatternCard key={index} morse={morse} />
            ))}
          </div>
        )}
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!validInput}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result && isSolved && (
        <SolverSection title="Transmit this letter" className="border-emerald-500/40">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Radio
              className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden
            />
            <span className="font-mono text-5xl font-bold text-emerald-700 dark:text-emerald-300">
              {result}
            </span>
            <span className="font-mono text-3xl tracking-widest text-emerald-600 dark:text-emerald-400">
              {MORSE_CODE[result] ? formatMorse(MORSE_CODE[result]) : ""}
            </span>
          </div>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Copy each flashing pattern directly; the cards identify the letters for you.
        The solver then picks the correct letter to transmit back.
      </SolverInstructions>
    </SolverLayout>
  );
}
