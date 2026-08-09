import { useCallback, useMemo, useState } from "react";
import { solveBlackHole, type BlackHoleOutput } from "../../services/blackHoleService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

interface SavedState {
  result?: BlackHoleOutput | null;
  twitchCommand?: string;
}

export default function BlackHoleSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [result, setResult] = useState<BlackHoleOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ result, twitchCommand }), [result, twitchCommand]);

  useSolverModulePersistence<SavedState, BlackHoleOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (saved.result !== undefined) setResult(saved.result);
      if (saved.twitchCommand !== undefined) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: BlackHoleOutput) => {
      if (!solution || !Number.isInteger(solution.digit)) return;
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.BLACK_HOLE, result: solution }));
    }, []),
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as BlackHoleOutput & { output?: BlackHoleOutput };
      return value.output ?? value;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveBlackHole(round.id, bomb.id, currentModule.id);
      const command = generateTwitchCommand({ moduleType: ModuleType.BLACK_HOLE, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id,
        { result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to advance Black Hole"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Shared code" description="Request one digit at a time, then perform its timing gesture on any unsolved Black Hole.">
      {result ? <div className="space-y-2 text-center" aria-live="polite">
        <p className="text-sm text-muted-foreground">Next digit</p>
        <p className="text-5xl font-bold tabular-nums">{result.digit}</p>
        <p className="text-sm">This Black Hole: {result.enteredHere} / {result.expectedHere}</p>
        <p className="text-sm">All Black Holes: {result.enteredGlobally} / {result.expectedGlobally}</p>
        {result.shortened && <p className="font-medium text-emerald-600">Two digits were removed after another module was solved.</p>}
      </div> : <p className="text-center text-sm text-muted-foreground">Bomb serial, ports, and Black Hole count are read automatically.</p>}
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Get next digit" />
    <ErrorAlert error={error} />
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>After entering a correct digit, solve a different module before requesting the next digit to remove two digits from this Black Hole’s requirement. A digit that solves this Black Hole does not grant that shortcut.</SolverInstructions>
  </SolverLayout>;
}
