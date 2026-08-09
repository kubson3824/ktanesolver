import { useCallback, useMemo, useState } from "react";
import { solveSimonSamples, type SimonSamplesOutput } from "../../services/simonSamplesService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, StageIndicator, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const SOUNDS = ["K", "S", "H", "O"];
const SOUND_NAMES: Record<string, string> = { K: "Kick", S: "Snare", H: "Hi-hat", O: "Open hi-hat" };

export default function SimonSamplesSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState(1);
  const [call, setCall] = useState("");
  const [padSounds, setPadSounds] = useState(SOUNDS);
  const [result, setResult] = useState<SimonSamplesOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ stage, call, padSounds, result, twitchCommand }), [stage, call, padSounds, result, twitchCommand]);
  useSolverModulePersistence<typeof state, SimonSamplesOutput>({ state, onRestoreState: useCallback((saved) => { if (saved.stage) setStage(saved.stage); if (saved.call !== undefined) setCall(saved.call); if (saved.padSounds) setPadSounds(saved.padSounds); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []), onRestoreSolution: useCallback((solution: SimonSamplesOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SIMON_SAMPLES, result: solution })); }, []), currentModule, setIsSolved });
  const changed = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { stage, call, padSounds };
      const response = await solveSimonSamples(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.SIMON_SAMPLES, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Simon Samples"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setStage(1); setCall(""); setPadSounds(SOUNDS); setResult(null); setTwitchCommand(""); resetSolverState(); };

  return <SolverLayout>
    <StageIndicator current={stage} total={3} />
    <SolverSection title="Call" description="Enter the complete call through the current stage using K, S, H, O (four sounds added per stage).">
      <input aria-label="Cumulative call" value={call} onChange={(event) => { setCall(event.target.value.toUpperCase()); changed(); }} disabled={isLoading || isSolved} placeholder={stage === 1 ? "KKSH" : stage === 2 ? "KKSH KKSS" : "KKSH KKSS KKSS"} className="h-11 w-full rounded-md border border-input bg-background px-3 font-mono tracking-widest" />
    </SolverSection>
    <SolverSection title="Physical pads" description="Choose the sound made by each pad in reading order.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{padSounds.map((sound, index) => <label key={index} className="text-sm font-medium">Pad {index + 1}<select aria-label={`Pad ${index + 1} sound`} value={sound} onChange={(event) => { const next = [...padSounds]; next[index] = event.target.value; setPadSounds(next); changed(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-2">{SOUNDS.map((option) => <option key={option} value={option}>{option} · {SOUND_NAMES[option]}</option>)}</select></label>)}</div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Build response" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Record this response" className="border-emerald-500/40"><p className="text-center font-mono text-2xl tracking-[0.25em]">{result.response.join("")}</p><p className="mt-2 text-center text-3xl font-semibold tracking-[0.3em]">{result.presses.join(" ")}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Start recording, then press every listed pad. A wrong pad stops recording but keeps the same stage and call. After a correct non-final stage, select the next stage and enter its longer call.</SolverInstructions>
  </SolverLayout>;
}
