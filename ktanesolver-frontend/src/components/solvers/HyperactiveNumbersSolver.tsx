import { useState } from "react";
import { solveHyperactiveNumbers, type HyperactiveNumbersOutput } from "../../services/hyperactiveNumbersService";
import type { BombEntity } from "../../types";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";

export default function HyperactiveNumbersSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [left, setLeft] = useState(0), [right, setRight] = useState(0);
  const [result, setResult] = useState<HyperactiveNumbersOutput | null>(null);
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset, currentModule, round, markModuleSolved } = useSolver();
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveHyperactiveNumbers(round.id, bomb.id, currentModule.id, left, right);
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Hyperactive Numbers"); }
    finally { setIsLoading(false); }
  };
  return <SolverLayout>
    <SolverSection title="Stable displays"><div className="grid grid-cols-2 gap-2"><input aria-label="Left number" type="number" min={0} max={99} value={left} onChange={event => { setLeft(Number(event.target.value)); setResult(null); }} className="h-11 rounded border bg-background px-2" /><input aria-label="Right number" type="number" min={0} max={99} value={right} onChange={event => { setRight(Number(event.target.value)); setResult(null); }} className="h-11 rounded border bg-background px-2" /></div></SolverSection>
    <SolverControls onSolve={solve} onReset={() => { setLeft(0); setRight(0); setResult(null); reset(); }} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Submit when the middle number is" className="border-emerald-500/40"><p className="capitalize">{result.color} and {result.parity}</p></SolverSection>}
    {result && <TwitchCommandDisplay command={`!number ${result.command}`} />}
    <SolverInstructions>The Twitch command waits for the required color and parity, then presses submit. Re-solve if either stable display changes.</SolverInstructions>
  </SolverLayout>;
}
