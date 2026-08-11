import { useCallback, useMemo, useState } from "react";
import { solveSynchronization, type SynchronizationOutput } from "../../services/synchronizationService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const INITIAL = [1, 2, 3, 4, 5, 0, 0, 0, 0];

export default function SynchronizationSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [displayNumber, setDisplayNumber] = useState(1);
  const [speeds, setSpeeds] = useState(INITIAL);
  const [result, setResult] = useState<SynchronizationOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ displayNumber, speeds, result, twitchCommand }), [displayNumber, speeds, result, twitchCommand]);
  useSolverModulePersistence<typeof state, SynchronizationOutput>({ state,
    onRestoreState: useCallback((saved) => { if (saved.displayNumber) setDisplayNumber(saved.displayNumber); if (saved.speeds) setSpeeds(saved.speeds); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: SynchronizationOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SYNCHRONIZATION, result: solution })); }, []), currentModule, setIsSolved,
  });
  const changed = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { displayNumber, speeds };
      const response = await solveSynchronization(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.SYNCHRONIZATION, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Synchronization"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setDisplayNumber(1); setSpeeds(INITIAL); setResult(null); setTwitchCommand(""); resetSolverState(); };

  return <SolverLayout>
    <SolverSection title="Display and initial speed ratings">
      <label className="block max-w-40 text-sm font-medium">Display number<input aria-label="Display number" type="number" min={1} max={9} value={displayNumber} onChange={(event) => { setDisplayNumber(Number(event.target.value)); changed(); }} disabled={isLoading || isSolved} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3" /></label>
      <div className="mt-4 grid grid-cols-3 gap-2">{speeds.map((speed, index) => <label key={index} className="text-center text-xs font-medium">{"ABC"[index % 3]}{Math.floor(index / 3) + 1}<select aria-label={`Light ${index + 1} speed`} value={speed} onChange={(event) => { const next = [...speeds]; next[index] = Number(event.target.value); setSpeeds(next); changed(); }} disabled={isLoading || isSolved} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3">{[0,1,2,3,4,5].map((value) => <option key={value}>{value}</option>)}</select></label>)}</div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Build sync sequence" />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Sync method: ${result.method.replace("_", " ")}`} className="border-emerald-500/40">
      <ol className="list-decimal space-y-2 pl-5">{result.steps.map((step, index) => <li key={index}>Light {step.firstPosition} while {step.firstState}, then light {step.secondPosition} while {step.secondState}</li>)}</ol>
      <p className="mt-3 font-semibold">Then press SYNC when whole seconds contains {result.timerDigit}.</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Speed 0 is a steady light. Execute each pair at the listed on/off phase. Holding SYNC resets the physical module to these same initial speeds, so the solution remains valid.</SolverInstructions>
  </SolverLayout>;
}
