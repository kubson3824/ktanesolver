import { useCallback, useMemo, useRef, useState } from "react";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveAlphabet, type AlphabetSolveResponse } from "../../services/alphabetService";
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
import { cn } from "../../lib/cn";

interface AlphabetSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function AlphabetSolver({ bomb }: AlphabetSolverProps) {
  const [letters, setLetters] = useState<string[]>(["", "", "", ""]);
  const [result, setResult] = useState<AlphabetSolveResponse["output"] | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

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

  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);

  const moduleState = useMemo(
    () => ({ letters, result, twitchCommand }),
    [letters, result, twitchCommand]
  );

  const onRestoreState = useCallback(
    (state: { letters?: string[]; result?: AlphabetSolveResponse["output"] | null; twitchCommand?: string } | { input?: { letters?: string[] } }) => {
      if ("input" in state && state.input?.letters) {
        setLetters(state.input.letters);
      } else if ("letters" in state && state.letters !== undefined) {
        setLetters(state.letters);
      }
      if ("result" in state && state.result !== undefined) setResult(state.result);
      if ("twitchCommand" in state && state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    []
  );

  const onRestoreSolution = useCallback(
    (solution: AlphabetSolveResponse["output"]) => {
      if (!solution?.pressOrder) return;
      setResult(solution);
      const command = generateTwitchCommand({ moduleType: ModuleType.ALPHABET, result: solution });
      setTwitchCommand(command);
    },
    []
  );

  useSolverModulePersistence<
    { letters: string[]; result: AlphabetSolveResponse["output"] | null; twitchCommand: string },
    AlphabetSolveResponse["output"]
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; result?: unknown };
        if ("result" in anyRaw) return anyRaw.result as AlphabetSolveResponse["output"];
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as AlphabetSolveResponse["output"];
        return raw as AlphabetSolveResponse["output"];
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleLetterChange = (index: number, value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z]/g, "");
    const updated = [...letters];
    updated[index] = upper.slice(-1); // keep only the last typed char
    setLetters(updated);
    if (error) clearError();
    if (upper && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const solveAlphabetModule = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }
    if (letters.some((l) => l.length !== 1)) {
      setError("Please enter all 4 letters");
      return;
    }

    clearError();
    setIsLoading(true);

    try {
      const response = await solveAlphabet(round.id, bomb.id, currentModule.id, {
        input: { letters },
      });

      const output = response.output;
      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({
        moduleType: ModuleType.ALPHABET,
        result: output,
      });
      setTwitchCommand(command);

      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { letters, result: output, twitchCommand: command },
        output,
        true,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Alphabet");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, letters, clearError, setIsLoading, setError, setIsSolved, markModuleSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setLetters(["", "", "", ""]);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  const allFilled = letters.every((l) => l.length === 1);

  return (
    <SolverLayout>
      <SolverSection
        title="Letters on module"
        description="Enter the four letters shown on the Alphabet module."
      >
        <div className="flex justify-center gap-2">
          {letters.map((letter, i) => (
            <Input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              value={letter}
              onChange={(e) => handleLetterChange(i, e.target.value)}
              className={cn(
                "h-14 w-12 px-0 text-center text-2xl font-bold font-mono rounded-md border-2 transition-colors",
                letter
                  ? "border-ring bg-accent/15 text-foreground"
                  : "border-border bg-muted/40 text-muted-foreground"
              )}
              maxLength={1}
              autoComplete="off"
              autoCapitalize="characters"
              aria-label={`Letter ${i + 1}`}
              disabled={isLoading || isSolved}
            />
          ))}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={solveAlphabetModule}
        onReset={reset}
        isSolveDisabled={!allFilled}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Press order" className="border-emerald-500/40">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {result.pressOrder.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden className="text-muted-foreground">→</span>}
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        The solver spells the longest possible word from the bank first, then
        presses any remaining letters in alphabetical order.
      </SolverInstructions>
    </SolverLayout>
  );
}
