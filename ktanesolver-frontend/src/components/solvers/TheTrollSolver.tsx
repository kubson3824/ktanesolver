import { useState } from "react";
import { solveTheTroll, type TheTrollOutput } from "../../services/theTrollService";
import type { BombEntity } from "../../types";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";

export default function TheTrollSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [result, setResult] = useState<TheTrollOutput | null>(null);
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const solve = async () => { if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information"); clearError(); setIsLoading(true); try { const response = await solveTheTroll(round.id, bomb.id, currentModule.id); setResult(response.output); setIsSolved(response.solved); if (response.solved) markModuleSolved(bomb.id, currentModule.id); } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Troll"); } finally { setIsLoading(false); } };
  return <SolverLayout><SolverControls onSolve={solve} onReset={() => { setResult(null); resetSolverState(); }} isLoading={isLoading} isSolved={isSolved} solveText="Calculate sequence" /><ErrorAlert error={error} />{result && <SolverSection title="Sequence" className="border-emerald-500/40"><ol className="list-decimal pl-5"><li>Press the Troll {result.prepPresses} times.</li><li>{result.additionalSolvesToActivate === 0 ? "It activates immediately after preparation." : `Solve exactly ${result.additionalSolvesToActivate} other non-Troll modules.`}</li><li>Press when the last timer digit is {result.timerDigit}.</li></ol><div className="mt-3 grid gap-2"><TwitchCommandDisplay command={`!number ${result.prepCommand}`} /><TwitchCommandDisplay command={`!number ${result.activationCommand}`} /></div></SolverSection>}<SolverInstructions>If another module solves at the wrong phase, recalculate because The Troll may return to dormant.</SolverInstructions></SolverLayout>;
}
