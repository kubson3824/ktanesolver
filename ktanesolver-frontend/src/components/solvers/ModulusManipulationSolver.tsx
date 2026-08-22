import { useState } from "react";
import { solveModulusManipulation, type ModulusManipulationOutput } from "../../services/modulusManipulationService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";

export default function ModulusManipulationSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [minutesRemaining, setMinutesRemaining] = useState(0), [result, setResult] = useState<ModulusManipulationOutput | null>(null), [command, setCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, currentModule, round, markModuleSolved } = useSolver();
  const solve = async () => { if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information"); setIsLoading(true); clearError();
    try { const response = await solveModulusManipulation(round.id, bomb.id, currentModule.id, { minutesRemaining }); setResult(response.output);
      const next = generateTwitchCommand({ moduleType: ModuleType.MODULUS_MANIPULATION, result: response.output }); setCommand(next); setIsSolved(response.solved); if (response.solved) markModuleSolved(bomb.id, currentModule.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Modulus Manipulation"); } finally { setIsLoading(false); } };
  return <SolverLayout><SolverSection title="Live timer"><label>Whole minutes remaining<input type="number" min={0} value={minutesRemaining} onChange={(e) => setMinutesRemaining(Number(e.target.value))} className="mt-1 block h-11 w-full rounded-md border bg-background px-3" /></label></SolverSection>
    <SolverControls onSolve={solve} onReset={() => { setResult(null); setCommand(""); setIsSolved(false); }} isLoading={isLoading} isSolved={isSolved} /><ErrorAlert error={error} />
    {result && <SolverSection title="Submit at these minutes"><p className="text-center text-3xl font-bold tabular-nums">{result.submission} at {result.minutesRemaining} min</p><p className="text-center text-sm text-muted-foreground">{result.otherUnsolvedModules} other unsolved module(s)</p></SolverSection>}{command && <TwitchCommandDisplay command={command} />}</SolverLayout>;
}
