import { useCallback, useMemo, useState } from "react";
import { solveTapCode, type TapCodeSolveResponse } from "../../services/tapCodeService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";

interface TapCodeSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function TapCodeSolver({ bomb }: TapCodeSolverProps) {
  const [receivedWord, setReceivedWord] = useState("");
  const [result, setResult] = useState<TapCodeSolveResponse["output"] | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolver, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ receivedWord, result, twitchCommand }), [receivedWord, result, twitchCommand]);

  useSolverModulePersistence<typeof state, TapCodeSolveResponse["output"]>({
    state,
    onRestoreState: useCallback((saved) => {
      const restored = "input" in saved
        ? (saved as { input?: { receivedWord?: string } }).input?.receivedWord
        : (saved as typeof state).receivedWord;
      if (restored) setReceivedWord(restored.toUpperCase());
      if ("result" in saved && saved.result) setResult(saved.result);
      if ("twitchCommand" in saved && saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: TapCodeSolveResponse["output"]) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.TAP_CODE, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (receivedWord.length !== 5) return setError("Enter the five-letter word you heard");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveTapCode(round.id, bomb.id, currentModule.id, receivedWord);
      const command = generateTwitchCommand({ moduleType: ModuleType.TAP_CODE, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { receivedWord, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Tap Code");
    } finally {
      setIsLoading(false);
    }
  }, [bomb?.id, clearError, currentModule?.id, markModuleSolved, receivedWord, round?.id, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setReceivedWord("");
    setResult(null);
    setTwitchCommand("");
    resetSolver();
  }, [resetSolver]);

  return (
    <SolverLayout>
      <SolverSection title="Received word" description="Hold the module and decode the five-letter word it taps.">
        <Input
          aria-label="Received word"
          value={receivedWord}
          onChange={(event) => setReceivedWord(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5))}
          onKeyDown={(event) => {
            if (event.key === "Enter" && receivedWord.length === 5 && !isLoading && !isSolved) void solve();
          }}
          maxLength={5}
          autoComplete="off"
          autoCapitalize="characters"
          disabled={isLoading || isSolved}
          className="mx-auto max-w-xs text-center font-mono text-xl tracking-[0.35em] uppercase"
        />
      </SolverSection>

      <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={receivedWord.length !== 5} isLoading={isLoading} isSolved={isSolved} />
      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Tap this word" className="border-emerald-500/40">
          <p className="text-center font-mono text-2xl font-bold tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
            {result.solutionWord.toUpperCase()}
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Tap pairs: {result.tapCode.join(" ")}
          </p>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>Each pair is the row and column tap count. Enter all five pairs, then tap once more to submit.</SolverInstructions>
    </SolverLayout>
  );
}
