import { useCallback, useMemo, useState } from "react";
import { solveSimonSounds, type SimonSoundsOutput } from "../../services/simonSoundsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const COLORS = ["RED", "BLUE", "YELLOW", "GREEN"];
export default function SimonSoundsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState(1), [samples, setSamples] = useState<string[]>([""]), [finalStage, setFinalStage] = useState(false), [result, setResult] = useState<SimonSoundsOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ stage, samples, finalStage, result, twitchCommand }), [stage, samples, finalStage, result, twitchCommand]);
  useSolverModulePersistence<typeof state, SimonSoundsOutput>({ state, onRestoreState: useCallback(saved => { if (saved.stage) setStage(saved.stage); if (saved.samples) setSamples(saved.samples); if (saved.finalStage !== undefined) setFinalStage(saved.finalStage); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []), onRestoreSolution: useCallback((solution: SimonSoundsOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SIMON_SOUNDS, result: solution })); }, []), currentModule, setIsSolved });
  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (samples.some(color => !color)) return setError("Select every sample color");
    clearError(); setIsLoading(true);
    try {
      const response = await solveSimonSounds(round.id, bomb.id, currentModule.id, stage, samples, finalStage);
      const command = generateTwitchCommand({ moduleType: ModuleType.SIMON_SOUNDS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { stage, samples, finalStage, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Simon Sounds"); }
    finally { setIsLoading(false); }
  };
  const setStageValue = (value: number) => { setStage(value); setSamples(current => Array.from({ length: value }, (_, index) => current[index] ?? "")); changed(); };
  const reset = () => { setStage(1); setSamples([""]); setFinalStage(false); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Current stage"><div className="grid gap-3 sm:grid-cols-2"><label>Stage<select value={stage} onChange={event => setStageValue(Number(event.target.value))} className="mt-1 h-11 w-full rounded border bg-background px-2">{[1,2,3,4,5].map(value => <option key={value}>{value}</option>)}</select></label><label className="flex items-end gap-2 pb-3"><input type="checkbox" checked={finalStage} onChange={event => { setFinalStage(event.target.checked); changed(); }} /> This is the final stage</label></div><div className="mt-3 grid gap-3 sm:grid-cols-3">{samples.map((color, index) => <label key={index}>Sound {index + 1}<select aria-label={`Sound ${index + 1} sample color`} value={color} onChange={event => { setSamples(current => current.map((value, position) => position === index ? event.target.value : value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-2"><option value="">Select</option>{COLORS.map(value => <option key={value}>{value.toLowerCase()}</option>)}</select></label>)}</div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Translate sequence" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press the input buttons" className="border-emerald-500/40"><p className="text-3xl font-bold">{result.presses.join(" → ")}</p><p className="mt-2 text-sm">Sample rule: {result.sampleCondition}. Input rule: {result.inputCondition}.</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Use the four top buttons to identify each sound, then enter those physical sample-button colors in order. Submit one stage at a time because the input rule can change as other modules solve. Mark only the actual final stage; there are 3–5 stages. Souvenir asks which sample button supplied the newly added sound in every stage.</SolverInstructions>
  </SolverLayout>;
}
