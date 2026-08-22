import { useState } from "react";
import { solveStackem, type StackemOutput } from "../../services/stackemService";
import type { BombEntity } from "../../types";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";

export default function StackemSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [targets, setTargets] = useState([1, 1, 1, 1]), [result, setResult] = useState<StackemOutput | null>(null);
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const command = result ? `!number ${result.stacks.flatMap((stack, slot) => Object.entries(stack.reduce<Record<string, number>>((counts, color) => ({ ...counts, [color]: (counts[color] ?? 0) + 1 }), {})).map(([color, count]) => `${color.toLowerCase()} ${slot + 1} ${count}`)).join(", ")}` : "";
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try { const response = await solveStackem(round.id, bomb.id, currentModule.id, targets); setResult(response.output); setIsSolved(response.solved); if (response.solved) markModuleSolved(bomb.id, currentModule.id); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Stack'em"); } finally { setIsLoading(false); }
  };
  return <SolverLayout><SolverSection title="Target sums"><div className="grid grid-cols-2 gap-3">{targets.map((value, index) => <label key={index}>Stack {index + 1}<input aria-label={`Stack ${index + 1} target`} type="number" min={1} max={30} value={value} onChange={event => { const next = [...targets]; next[index] = Number(event.target.value); setTargets(next); setResult(null); clearError(); }} className="mt-1 h-11 w-full rounded border bg-background px-2" /></label>)}</div></SolverSection><SolverControls onSolve={solve} onReset={() => { setTargets([1,1,1,1]); setResult(null); resetSolverState(); }} isLoading={isLoading} isSolved={isSolved} /><ErrorAlert error={error} />{result && <SolverSection title="Stacks" className="border-emerald-500/40"><p className="mb-2 text-sm">Cube values: {Object.entries(result.cubeValues).map(([color, value]) => `${color}=${value}`).join(", ")}</p>{result.stacks.map((stack, index) => <p key={index}>Stack {index + 1}: {stack.join(" + ")}</p>)}</SolverSection>}{command && <TwitchCommandDisplay command={command} />}<SolverInstructions>Run the placement command, then submit. The upstream parser accepts color, slot, count groups; submit is a separate command.</SolverInstructions></SolverLayout>;
}
