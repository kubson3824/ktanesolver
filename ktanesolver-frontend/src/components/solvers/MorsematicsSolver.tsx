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

function formatMorse(morse: string): string {
  return morse.replace(/\./g, "·").replace(/-/g, "−");
}

function MorsePatternCard({ letter }: { letter: string }) {
  const morse = MORSE_CODE[letter];
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
  const [letters, setLetters] = useState<string>("");
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

  const moduleState = useMemo(
    () => ({ letters, result, twitchCommand }),
    [letters, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: { letters?: string; result?: string; twitchCommand?: string }) => {
      if (state.letters !== undefined) setLetters(state.letters);
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
    { letters: string; result: string; twitchCommand: string },
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
    if (!letters || letters.length !== 3) {
      setError("Please enter exactly 3 letters");
      return;
    }
    if (!/^[a-zA-Z]{3}$/.test(letters)) {
      setError("Please enter only letters (A-Z)");
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

  const handleLetterChange = (value: string) => {
    const filtered = value
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .slice(0, 3);
    setLetters(filtered);
    if (isSolved) {
      setResult("");
      setTwitchCommand("");
    }
  };

  const reset = () => {
    setLetters("");
    setResult("");
    setTwitchCommand("");
    resetSolverState();
  };

  const disabled = isLoading || isSolved;
  const letterList = letters.split("");

  return (
    <SolverLayout>
      <SolverSection
        title="Received letters"
        description="Enter the 3 letters you decoded from the module's flashing Morse lights."
      >
        <Input
          type="text"
          value={letters}
          onChange={(e) => handleLetterChange(e.target.value)}
          placeholder="ABC"
          maxLength={3}
          disabled={disabled}
          aria-label="Received letters"
          className="text-center font-mono text-2xl uppercase tracking-[0.5em]"
        />

        {letterList.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {letterList.map((char, index) => (
              <MorsePatternCard key={index} letter={char} />
            ))}
          </div>
        )}
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={letters.length !== 3}
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
        Decode the Morse flashes on the module into their 3 letters, enter them here,
        and the solver picks the correct letter to transmit back.
      </SolverInstructions>
    </SolverLayout>
  );
}
