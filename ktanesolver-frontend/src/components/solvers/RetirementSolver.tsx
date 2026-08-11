import { useCallback, useMemo, useState } from "react";
import { solveRetirement, type RetirementOutput } from "../../services/retirementService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const HOME_OPTIONS = ["Briar Hollow", "Broadwood", "Homestead", "Hotham Place", "Leafy Green", "Lodge Park", "Riverside", "Riverwell", "Sunnydale", "Sunnyside"];
const emptyHomes = () => Array(5).fill("") as string[];

export default function RetirementSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [homes, setHomes] = useState(emptyHomes);
  const [result, setResult] = useState<RetirementOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ homes, result, twitchCommand }), [homes, result, twitchCommand]);
  useSolverModulePersistence<typeof state, RetirementOutput>({
    state,
    onRestoreState: useCallback(saved => {
      if (saved.homes) setHomes(saved.homes);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: RetirementOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.RETIREMENT, result: solution }));
    }, []),
    currentModule, setIsSolved,
  });
  const changed = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveRetirement(round.id, bomb.id, currentModule.id, homes);
      const command = generateTwitchCommand({ moduleType: ModuleType.RETIREMENT, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { homes, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Retirement"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setHomes(emptyHomes()); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Homes on offer" description="Enter the five homes currently shown, in any order.">
      <div className="space-y-2">{homes.map((home, index) => <select key={index} aria-label={`Home ${index + 1}`} value={home} onChange={event => { setHomes(current => current.map((value, i) => i === index ? event.target.value : value)); changed(); }} className="h-11 w-full rounded border bg-background px-3">
        <option value="">Select home {index + 1}…</option>{HOME_OPTIONS.map(option => <option key={option}>{option}</option>)}
      </select>)}</div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Retire Bob here" className="border-emerald-500/40">
      <p className="text-3xl font-bold">{result.home}</p>
      <p className="mt-2 text-sm">Family: {result.wife} (×3), {result.child} (×2), {result.sibling} (×1)</p>
      <div className="mt-3 space-y-1 text-sm">{result.scores.map(score => <p key={score.home}><strong>{score.home}</strong>: {score.wifeScore} + {score.childScore} + {score.siblingScore} = {score.total}</p>)}</div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Use the exact capitalization shown in the generated Twitch command. An incorrect retirement regenerates all five homes; replace every entry and solve again. Souvenir may ask for any offered home other than the chosen one.</SolverInstructions>
  </SolverLayout>;
}
