import { useCallback, useMemo, useState } from "react";
import { solveSimpleton, type SimpletonOutput } from "../../services/simpletonService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function SimpletonSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [result, setResult] = useState<SimpletonOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ result, twitchCommand }), [result, twitchCommand]);
  useSolverModulePersistence<typeof state, SimpletonOutput>({
    state,
    onRestoreState: useCallback(saved => { if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: SimpletonOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SIMPLETON, result: solution })); }, []),
    currentModule, setIsSolved,
  });
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveSimpleton(round.id, bomb.id, currentModule.id);
      const command = generateTwitchCommand({ moduleType: ModuleType.SIMPLETON, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Simpleton"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="The Simpleton"><p className="text-center text-lg">No observations or edgework are needed.</p></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Show action" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Action" className="border-emerald-500/40"><p className="text-center text-4xl font-bold">PUSH</p><p className="mt-2 text-center">Press and release the button.</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The module passes when the button is released. The Simpleton is not a Souvenir candidate.</SolverInstructions>
  </SolverLayout>;
}
