import { useCallback, useMemo, useState } from "react";
import { solveUncoloredSquares, type UncoloredSquaresColor, type UncoloredSquaresOutput } from "../../services/uncoloredSquaresService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, useSolver, useSolverModulePersistence } from "../common";

const COLORS: UncoloredSquaresColor[] = ["RED", "GREEN", "BLUE", "YELLOW", "MAGENTA", "BLACK"];
const INITIAL: UncoloredSquaresColor[] = ["RED", "GREEN", "BLUE", "YELLOW", "MAGENTA", "BLUE", "YELLOW", "MAGENTA", "RED", "GREEN", "BLUE", "YELLOW", "MAGENTA", "BLUE", "YELLOW", "MAGENTA"];
const swatches: Record<UncoloredSquaresColor, string> = {
  RED: "#dc2626", GREEN: "#16a34a", BLUE: "#2563eb", YELLOW: "#eab308", MAGENTA: "#d946ef", BLACK: "#111827",
};

export default function UncoloredSquaresSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [grid, setGrid] = useState<UncoloredSquaresColor[]>(INITIAL);
  const [result, setResult] = useState<UncoloredSquaresOutput | null>(null);
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ grid, result }), [grid, result]);
  useSolverModulePersistence<typeof state, UncoloredSquaresOutput>({
    state,
    onRestoreState: useCallback((saved) => { if (saved.grid) setGrid(saved.grid); if (saved.result) setResult(saved.result); }, []),
    onRestoreSolution: useCallback((solution: UncoloredSquaresOutput) => setResult(solution), []), currentModule, setIsSolved,
  });

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { grid };
      const response = await solveUncoloredSquares(round.id, bomb.id, currentModule.id, input);
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Uncolored Squares"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setGrid(INITIAL); setResult(null); resetSolverState(); };

  return <SolverLayout>
    <SolverSection title="Current 4×4 grid">
      <div className="grid grid-cols-4 gap-2">{grid.map((color, index) => <label key={index} className="grid gap-1 text-center text-xs font-medium">
        {"ABCD"[index % 4]}{Math.floor(index / 4) + 1}
        <select aria-label={`Square ${"ABCD"[index % 4]}${Math.floor(index / 4) + 1}`} value={color} disabled={isLoading || isSolved}
          onChange={(event) => { const next = [...grid]; next[index] = event.target.value as UncoloredSquaresColor; setGrid(next); setResult(null); clearError(); }}
          className="h-10 rounded-md border border-input px-1 text-xs text-white" style={{ backgroundColor: swatches[color] }}>
          {COLORS.map((option) => <option key={option} value={option} style={{ backgroundColor: swatches[option] }}>{option}</option>)}
        </select>
      </label>)}</div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find pattern" />
    <ErrorAlert error={error} />
    {result && <SolverSection title={result.willSolve ? "Final pattern" : "Next pattern"} className="border-emerald-500/40">
      <p><strong>Least colors:</strong> {result.firstColor} first, then {result.otherColor}</p>
      <pre className="mt-3 text-2xl leading-none">{result.pattern.map((row) => row.replaceAll("#", "■").replaceAll(" ", "·")).join("\n")}</pre>
      <p className="mt-3"><strong>Valid placements:</strong> {result.placements.map((cells) => cells.join(" ")).join(" · ")}</p>
    </SolverSection>}
    <SolverInstructions>Press every square in any one listed placement. Enter the new grid for the next stage. A strike creates a completely new first stage, so reset this solver and replace all 16 colors. The upstream module has forced-solve support but no Twitch chat command parser.</SolverInstructions>
  </SolverLayout>;
}
