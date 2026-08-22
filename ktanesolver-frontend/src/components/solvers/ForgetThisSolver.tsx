import { useCallback, useMemo, useState } from "react";
import { FORGET_THIS_COLORS, solveForgetThis, type ForgetThisColor, type ForgetThisOutput, type ForgetThisStage } from "../../services/forgetThisService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const DEFAULT_STAGES: ForgetThisStage[] = [{ digit: "0", color: "CYAN" }, { digit: "0", color: "MAGENTA" }];
const colorLabel = (color: ForgetThisColor) => color[0] + color.slice(1).toLowerCase();

export default function ForgetThisSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stages, setStages] = useState<ForgetThisStage[]>(DEFAULT_STAGES);
  const [implementationStages, setImplementationStages] = useState([2,2,2,2,2]);
  const [result, setResult] = useState<ForgetThisOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ stages, implementationStages, result, twitchCommand }), [stages, implementationStages, result, twitchCommand]);

  useSolverModulePersistence<typeof state, ForgetThisOutput>({
    state,
    onRestoreState: useCallback(saved => { if (saved.stages) setStages(saved.stages); if (saved.implementationStages) setImplementationStages(saved.implementationStages); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: ForgetThisOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.FORGET_THIS, result: solution })); }, []),
    currentModule, setIsSolved,
  });
  const clear = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const updateStage = (index: number, patch: Partial<ForgetThisStage>) => { setStages(current => current.map((stage, position) => position === index ? { ...stage, ...patch } : stage)); clear(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveForgetThis(round.id, bomb.id, currentModule.id, stages, implementationStages);
      const command = generateTwitchCommand({ moduleType: ModuleType.FORGET_THIS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { stages, implementationStages, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Forget This"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setStages(DEFAULT_STAGES); setImplementationStages([2,2,2,2,2]); setResult(null); setTwitchCommand(""); resetSolverState(); };

  return <SolverLayout>
    <SolverSection title="Stage history" description="Record every displayed digit and LED color in order.">
      <div className="space-y-2">{stages.map((stage, index) => <div key={index} className="grid grid-cols-[5rem_1fr_1fr] items-center gap-2">
        <span className="font-medium">Stage {index + 1}</span>
        <input aria-label={`Stage ${index + 1} digit`} value={stage.digit} maxLength={1} onChange={event => updateStage(index, { digit: event.target.value.toUpperCase() })} className="h-10 rounded border bg-background px-3 font-mono uppercase" />
        <select aria-label={`Stage ${index + 1} LED color`} value={stage.color} onChange={event => updateStage(index, { color: event.target.value as ForgetThisColor })} className="h-10 rounded border bg-background px-2">{FORGET_THIS_COLORS.map(color => <option key={color} value={color}>{colorLabel(color)}</option>)}</select>
      </div>)}</div>
      <div className="mt-3 flex gap-2"><button type="button" onClick={() => { setStages(current => [...current, { digit: "0", color: "CYAN" }]); clear(); }} className="rounded border px-3 py-2">Add stage</button><button type="button" disabled={stages.length <= 2} onClick={() => { setStages(current => current.slice(0, -1)); clear(); }} className="rounded border px-3 py-2 disabled:opacity-50">Remove last</button></div>
    </SolverSection>
    <SolverSection title="Stages to implement"><div className="grid grid-cols-5 gap-2">{implementationStages.map((stage, index) => <label key={index}>#{index + 1}<input aria-label={`Implementation stage ${index + 1}`} type="number" min={2} max={stages.length} value={stage} onChange={event => { setImplementationStages(current => current.map((value, position) => position === index ? Number(event.target.value) : value)); clear(); }} className="mt-1 h-10 w-full rounded border bg-background px-2" /></label>)}</div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate final digit" /><ErrorAlert error={error} />
    {result && <SolverSection title={`Submit ${result.answer}`} className="border-emerald-500/40"><p className="text-sm text-muted-foreground">Decimal value: {result.decimalAnswer}</p>{result.steps.map((step, index) => <p key={index} className="mt-2"><span className="font-semibold">#{index + 1}, stage {step.stage}:</span> {step.before} → {step.operation} → {step.after}</p>)}</SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Record each stage as it appears. At the end, enter the five displayed stage numbers from top to bottom. After a strike, keep the history and replace only those five numbers. Digits and LED colors are retained for every Souvenir stage question.</SolverInstructions>
  </SolverLayout>;
}
