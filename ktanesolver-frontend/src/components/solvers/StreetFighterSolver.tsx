import { useCallback, useMemo, useState } from "react";
import { solveStreetFighter, type StreetFighterOutput } from "../../services/streetFighterService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function StreetFighterSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [result, setResult] = useState<StreetFighterOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ result, twitchCommand }), [result, twitchCommand]);
  useSolverModulePersistence<typeof state, StreetFighterOutput>({
    state,
    onRestoreState: useCallback(saved => { if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: StreetFighterOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.STREET_FIGHTER, result: solution })); }, []),
    currentModule, setIsSolved,
  });
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveStreetFighter(round.id, bomb.id, currentModule.id);
      const command = generateTwitchCommand({ moduleType: ModuleType.STREET_FIGHTER, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Street Fighter"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Choose fighters" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Recommended matchup" className="border-emerald-500/40">
      <p className="text-sm">Required name letter: <strong>{result.requiredLetter}</strong></p>
      <p className="mt-3 text-2xl font-bold">{result.fighter} vs. {result.opponent}</p>
      <p className="mt-3 text-sm">All eligible player fighters: {result.eligibleFighters.join(", ")}</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Select the recommended fighter first, then the opponent. The first choice is deterministic; any listed eligible fighter is legal, but each has its own calculated opponent.</SolverInstructions>
  </SolverLayout>;
}
