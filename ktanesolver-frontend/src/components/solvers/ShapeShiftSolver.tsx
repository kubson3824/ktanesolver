import { useCallback, useMemo, useState } from "react";
import { solveShapeShift, type ShapeEdge, type ShapeShiftOutput } from "../../services/shapeShiftService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, useSolver, useSolverModulePersistence } from "../common";
import { Button } from "../ui/button";

export const EDGES: ShapeEdge[] = ["SQUARE", "ROUND", "POINT", "CONCAVE"];
const LABELS: Record<ShapeEdge, string> = { SQUARE: "Square", ROUND: "Round", POINT: "Point", CONCAVE: "Concave" };

function edgePath(edge: ShapeEdge, side: "left" | "right") {
  const x = side === "left" ? 25 : 95;
  const outside = side === "left" ? 5 : 115;
  const startY = side === "left" ? 65 : 15;
  const endY = side === "left" ? 15 : 65;
  if (edge === "SQUARE") return `L ${x} ${endY}`;
  if (edge === "ROUND") return `Q ${outside} ${startY} ${outside} 40 Q ${outside} ${endY} ${x} ${endY}`;
  if (edge === "POINT") return `L ${outside} 40 L ${x} ${endY}`;
  return side === "left"
    ? "Q 25 50 15 50 L 15 30 Q 25 30 25 15"
    : "Q 95 30 105 30 L 105 50 Q 95 50 95 65";
}

export function Shape({ left, right, className = "h-20 w-32" }: { left: ShapeEdge; right: ShapeEdge; className?: string }) {
  const path = `M 25 15 L 95 15 ${edgePath(right, "right")} L 25 65 ${edgePath(left, "left")} Z`;
  return <svg viewBox="0 0 120 80" className={className} aria-label={`${LABELS[left]} left, ${LABELS[right]} right`}><path d={path} fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /></svg>;
}

export default function ShapeShiftSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [left, setLeft] = useState<ShapeEdge>("SQUARE");
  const [right, setRight] = useState<ShapeEdge>("SQUARE");
  const [result, setResult] = useState<ShapeShiftOutput | null>(null);
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ left, right, result }), [left, right, result]);

  useSolverModulePersistence<typeof moduleState, ShapeShiftOutput>({
    state: moduleState,
    onRestoreState: useCallback((state) => {
      if (state.left && EDGES.includes(state.left)) setLeft(state.left);
      if (state.right && EDGES.includes(state.right)) setRight(state.right);
      if (state.result) setResult(state.result);
    }, []),
    onRestoreSolution: useCallback((solution: ShapeShiftOutput) => setResult(solution), []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const input = { left, right };
      const response = await solveShapeShift(round.id, bomb.id, currentModule.id, input);
      setResult(response.output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output }, response.output, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Shape Shift");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, left, right, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setLeft("SQUARE"); setRight("SQUARE"); setResult(null); resetSolverState();
  }, [resetSolverState]);

  const choose = (side: "left" | "right", edge: ShapeEdge) => {
    (side === "left" ? setLeft : setRight)(edge); setResult(null); clearError();
  };

  return <SolverLayout>
    <SolverSection title="Displayed shape" description="Select the profile on each side of the shape.">
      <Shape left={left} right={right} className="mx-auto mb-4 h-28 w-44 text-primary" />
      {(["left", "right"] as const).map((side) => <div key={side} className="mb-3">
        <div className="mb-2 text-sm font-medium capitalize">{side} side</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {EDGES.map((edge) => <Button key={edge} variant={(side === "left" ? left : right) === edge ? "default" : "outline"} onClick={() => choose(side, edge)} disabled={isLoading || isSolved}>{LABELS[edge]}</Button>)}
        </div>
      </div>)}
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Submit this shape" className="border-emerald-500/40">
      <Shape left={result.left} right={result.right} className="mx-auto h-36 w-56 text-emerald-600" />
      <p className="text-center font-semibold">{LABELS[result.left]} left · {LABELS[result.right]} right</p>
    </SolverSection>}
    <SolverInstructions>Match the two side profiles shown on the module. The solver uses the bomb's recorded ports, indicators, batteries, and serial number.</SolverInstructions>
  </SolverLayout>;
}
