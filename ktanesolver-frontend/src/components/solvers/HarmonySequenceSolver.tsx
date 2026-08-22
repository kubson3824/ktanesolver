import { useCallback, useMemo, useState } from "react";
import { solveHarmonySequence, type HarmonySequenceOutput } from "../../services/harmonySequenceService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function HarmonySequenceSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState(1), [ranks, setRanks] = useState([1, 2, 3, 4]), [result, setResult] = useState<HarmonySequenceOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ stage, ranks, result, twitchCommand }), [stage, ranks, result, twitchCommand]);
  useSolverModulePersistence<typeof state, HarmonySequenceOutput>({ state, onRestoreState: useCallback(saved => { if (saved.stage) setStage(saved.stage); if (saved.ranks) setRanks(saved.ranks); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []), onRestoreSolution: useCallback((solution: HarmonySequenceOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.HARMONY_SEQUENCE, result: solution })); }, []), currentModule, setIsSolved });
  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveHarmonySequence(round.id, bomb.id, currentModule.id, stage, ranks);
      const command = generateTwitchCommand({ moduleType: ModuleType.HARMONY_SEQUENCE, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { stage, ranks, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Harmony Sequence"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setStage(1); setRanks([1, 2, 3, 4]); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Stage and pitch order"><label>Stage<select value={stage} onChange={event => { setStage(Number(event.target.value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-2">{[1,2,3,4].map(value => <option key={value}>{value}</option>)}</select></label><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{ranks.map((rank, index) => <label key={index}>Button {index + 1}<select aria-label={`Button ${index + 1} pitch rank`} value={rank} onChange={event => { setRanks(current => current.map((value, position) => position === index ? Number(event.target.value) : value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-2">{[1,2,3,4].map(value => <option key={value} value={value}>{value} — {value === 1 ? "lowest" : value === 4 ? "highest" : ""}</option>)}</select></label>)}</div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Sort pitches" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press left-to-right positions" className="border-emerald-500/40"><p className="text-4xl font-bold">{result.pressPositions.join(" → ")}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Hold the red listen button and assign pitch rank 1 to the lowest note and 4 to the highest. The four entries correspond to the buttons from left to right. Repeat for all four stages. Harmony Sequence is not a Souvenir candidate.</SolverInstructions>
  </SolverLayout>;
}
