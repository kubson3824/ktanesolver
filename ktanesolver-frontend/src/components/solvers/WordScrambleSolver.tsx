import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  solveWordScramble,
  type WordScrambleSolveRequest,
  type WordScrambleSolveResponse,
} from "../../services/wordScrambleService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverResult,
} from "../common";
import { Input } from "../ui/input";
import { cn } from "../../lib/cn";

interface WordScrambleSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function WordScrambleSolver({ bomb }: WordScrambleSolverProps) {
  const [letters, setLetters] = useState<string>("");
  const [result, setResult] = useState<WordScrambleSolveResponse["output"] | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);

  const {
    isLoading,
    error,
    isSolved,
    clearError,
    reset,
    setIsLoading,
    setError,
    setIsSolved,
    round,
    markModuleSolved,
  } = useSolver();

  const moduleState = useMemo(
    () => ({ letters, result, twitchCommand }),
    [letters, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: { letters?: string; result?: WordScrambleSolveResponse["output"] | null; twitchCommand?: string }) => {
      if (state.letters !== undefined) setLetters(state.letters);
      if (state.result) setResult(state.result);
      if (state.twitchCommand) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: WordScrambleSolveResponse["output"]) => {
      setResult(solution);

      if (solution.solved) {
        const command = generateTwitchCommand({
          moduleType: ModuleType.WORD_SCRAMBLE,
          result: { instruction: solution.instruction },
        });
        setTwitchCommand(command);
      }
    },
    [],
  );

  useSolverModulePersistence<
    { letters: string; result: WordScrambleSolveResponse["output"] | null; twitchCommand: string },
    WordScrambleSolveResponse["output"]
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) =>
      raw && typeof raw === "object" ? (raw as WordScrambleSolveResponse["output"]) : null,
    inferSolved: (solution) => Boolean(solution?.solved),
    currentModule,
    setIsSolved,
  });

  const handleLettersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
    if (value.length <= 6) {
      setLetters(value);
      clearError();
    }
  };

  const solveWordScrambleModule = async () => {
    setIsLoading(true);
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      setIsLoading(false);
      return;
    }

    if (letters.length !== 6) {
      setError("Please enter exactly 6 letters");
      setIsLoading(false);
      return;
    }

    clearError();

    try {
      const input: WordScrambleSolveRequest["input"] = {
        letters: letters,
      };

      const response = await solveWordScramble(round.id, bomb.id, currentModule.id, { input });

      setResult(response.output);

      if (response.output) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);

        const command = generateTwitchCommand({
          moduleType: ModuleType.WORD_SCRAMBLE,
          result: response.output,
        });
        setTwitchCommand(command);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve word scramble");
    } finally {
      setIsLoading(false);
    }
  };

  const resetModule = () => {
    setLetters("");
    setResult(null);
    setTwitchCommand("");
    reset();
  };

  return (
    <SolverLayout>
      <SolverSection
        title="Scrambled letters"
        description="Enter the six letters displayed on the module."
      >
        <div className="mb-3 grid grid-cols-6 gap-1.5">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md border-2 text-xl font-bold uppercase",
                letters[i]
                  ? "border-ring bg-accent/15 text-foreground"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              {letters[i] || ""}
            </div>
          ))}
        </div>

        <Input
          type="text"
          value={letters}
          onChange={handleLettersChange}
          placeholder="Type 6 letters"
          className="text-center text-lg font-mono tracking-widest"
          maxLength={6}
          disabled={isLoading || isSolved}
          aria-label="Scrambled letters"
        />
        <p className="mt-1.5 text-center text-xs text-muted-foreground tabular-nums">
          {letters.length}/6 letters
        </p>
      </SolverSection>

      <SolverControls
        onSolve={() => {
          void solveWordScrambleModule();
        }}
        onReset={resetModule}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
        isSolveDisabled={letters.length !== 6}
      />

      <ErrorAlert error={error} />

      {result && (
        <>
          {result.solved && result.solution ? (
            <SolverResult
              variant="success"
              title="Solution found"
              description={`Word: ${result.solution}\n${result.instruction}`}
            />
          ) : (
            <SolverResult variant="info" title="No solution" description={result.instruction} />
          )}
        </>
      )}

      {twitchCommand && result && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        The solver searches for the first valid six-letter English word that can be
        formed from the scrambled letters.
      </SolverInstructions>
    </SolverLayout>
  );
}
