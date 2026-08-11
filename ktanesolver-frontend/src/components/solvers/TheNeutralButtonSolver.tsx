import { useCallback, useMemo, useState } from "react";
import { solveNeutralButton, type NeutralButtonOutput } from "../../services/neutralButtonService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function TheNeutralButtonSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [result, setResult] = useState<NeutralButtonOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ result, twitchCommand }), [result, twitchCommand]);
  useSolverModulePersistence<typeof state, NeutralButtonOutput>({
    state,
    onRestoreState: useCallback(saved => { if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: NeutralButtonOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.THE_NEUTRAL_BUTTON, result: solution })); }, []),
    currentModule, setIsSolved,
  });
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveNeutralButton(round.id, bomb.id, currentModule.id);
      const command = generateTwitchCommand({ moduleType: ModuleType.THE_NEUTRAL_BUTTON, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Neutral Button"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="The Neutral Button"><p className="text-center text-lg">Watch the face; no edgework is needed.</p></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Show timing" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Action" className="border-emerald-500/40"><p className="text-center text-3xl font-bold">PRESS WHEN IT BLINKS</p><p className="mt-2 text-center">Press within {result.windowMilliseconds} ms of blink onset.</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The eyes visibly close for 150 ms, but the module accepts the press for 500 ms from blink onset. The Twitch command waits for the blink automatically. This module is not a Souvenir candidate.</SolverInstructions>
  </SolverLayout>;
}
