import { useState } from "react";
import { solveBlueArrows, type BlueArrowsOutput } from "../../services/blueArrowsService";
import type { BombEntity } from "../../types";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";

export default function BlueArrowsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [coordinate, setCoordinate] = useState("");
  const [result, setResult] = useState<BlueArrowsOutput | null>(null);
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset, currentModule, round, markModuleSolved } = useSolver();
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveBlueArrows(round.id, bomb.id, currentModule.id, coordinate);
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Blue Arrows"); }
    finally { setIsLoading(false); }
  };
  return <SolverLayout>
    <SolverSection title="Displayed coordinate"><input aria-label="Displayed coordinate" maxLength={2} value={coordinate} onChange={event => { setCoordinate(event.target.value.toUpperCase()); setResult(null); }} placeholder="CA" className="h-11 w-full rounded border bg-background px-2 uppercase" /></SolverSection>
    <SolverControls onSolve={solve} onReset={() => { setCoordinate(""); setResult(null); reset(); }} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press in order" className="border-emerald-500/40"><p>{result.directions.join(" → ")}</p></SolverSection>}
    {result && <TwitchCommandDisplay command={`!number ${result.command}`} />}
    <SolverInstructions>Enter the two characters shown around the center button. The solver applies the rule-seed-one priority operations in source order.</SolverInstructions>
  </SolverLayout>;
}
