import { useCallback, useMemo, useState } from "react";
import { solvePigpenRotations, type PigpenRotationsOutput } from "../../services/pigpenRotationsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function PigpenRotationsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [displayed, setDisplayed] = useState(""), [result, setResult] = useState<PigpenRotationsOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ displayed, result, twitchCommand }), [displayed, result, twitchCommand]);
  useSolverModulePersistence<typeof state, PigpenRotationsOutput>({ state, onRestoreState: useCallback(saved => { if (saved.displayed) setDisplayed(saved.displayed); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []), onRestoreSolution: useCallback((solution: PigpenRotationsOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.PIGPEN_ROTATIONS, result: solution })); }, []), currentModule, setIsSolved });
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solvePigpenRotations(round.id, bomb.id, currentModule.id, displayed);
      const command = generateTwitchCommand({ moduleType: ModuleType.PIGPEN_ROTATIONS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { displayed, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Pigpen Rotations"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setDisplayed(""); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Decoded pigpen display"><label>12 letters<input aria-label="Decoded pigpen letters" value={displayed} maxLength={12} onChange={event => { setDisplayed(event.target.value.toUpperCase().replace(/[^A-Z]/g, "")); setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); }} className="mt-1 h-11 w-full rounded border bg-background px-3 font-mono uppercase" /></label></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Decode rotation" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Type and submit" className="border-emerald-500/40"><p className="break-all font-mono text-4xl font-bold">{result.answer}</p><p className="mt-2 text-sm">Shift each letter backward by {result.shift}.</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>First translate each displayed pigpen symbol into A–Z, then enter the 12 letters in reading order. The module rotates forward by the battery count; with no batteries it uses 13. Pigpen Rotations is not a Souvenir candidate.</SolverInstructions>
  </SolverLayout>;
}
