import { useCallback, useMemo, useState } from "react";
import { solveWordSearch, type WordSearchOutput } from "../../services/wordSearchService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  useSolver, useSolverModulePersistence,
} from "../common";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const CORNER_LABELS = ["Top left", "Top right", "Bottom left", "Bottom right"];

export default function WordSearchSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [corners, setCorners] = useState("");
  const [result, setResult] = useState<WordSearchOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ corners, result }), [corners, result]);

  useSolverModulePersistence<typeof moduleState, WordSearchOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.corners !== undefined) setCorners(state.corners);
      if (state.result !== undefined) setResult(state.result);
    },
    onRestoreSolution: setResult,
    inferSolved: (_solution, module) => Boolean(module && typeof module === "object" && "solved" in module && module.solved),
    currentModule,
    setIsSolved,
  });

  const changeCorners = (value: string) => {
    setCorners(value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4));
    setResult(null); clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (corners.length !== 4) return setError("Enter all four corner letters");
    clearError(); setIsLoading(true);
    try {
      const response = await solveWordSearch(round.id, bomb.id, currentModule.id, corners);
      setResult(response.output); setIsSolved(response.solved);
      updateModuleAfterSolve(bomb.id, currentModule.id, { corners, result: response.output }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to get Word Search candidates"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, corners, clearError, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const confirmSolved = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id || !result) return;
    clearError(); setIsLoading(true);
    try {
      const response = await solveWordSearch(round.id, bomb.id, currentModule.id, corners, true);
      setResult(response.output); setIsSolved(true); markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { corners, result: response.output }, response.output, true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to mark Word Search solved"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, result, corners, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setCorners(""); setResult(null); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Corner letters" description="Enter top-left, top-right, bottom-left, then bottom-right.">
      <div className="mx-auto grid max-w-48 grid-cols-2 gap-2">
        {CORNER_LABELS.map((label, index) => <div key={label} className="rounded border border-border bg-muted/30 p-3 text-center">
          <span className="block text-xs text-muted-foreground">{label}</span>
          <span className="mt-1 block font-mono text-2xl font-bold" aria-label={`${label}: ${corners[index] ?? "empty"}`}>
            {corners[index] ?? "—"}
          </span>
        </div>)}
      </div>
      <Input
        value={corners}
        onChange={(event) => changeCorners(event.target.value)}
        disabled={isLoading || isSolved}
        placeholder="Four corner letters"
        aria-label="Corner letters in reading order"
        className="mt-3 text-center font-mono text-lg tracking-widest"
      />
      <p className="mt-1 text-center text-xs text-muted-foreground">{corners.length}/4 letters</p>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={corners.length !== 4} solveText="Get words" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Possible words" description="Exactly one of these appears in the grid.">
      <ul className="grid grid-cols-2 gap-2">
        {result.words.map((word) => <li key={word} className="rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-center font-mono text-lg font-bold">
          {word}
        </li>)}
      </ul>
      <Button type="button" variant="success" className="mt-3 w-full" loading={isLoading} disabled={isSolved} onClick={() => void confirmSolved()}>
        {isSolved ? "Solved" : "Mark solved"}
      </Button>
    </SolverSection>}
    <SolverInstructions>Find the one listed word in the grid, then select its first and last letters on the module.</SolverInstructions>
  </SolverLayout>;
}
