import { useCallback, useMemo, useState } from "react";

import { solveSink, type SinkInput, type SinkOutput } from "../../services/sinkService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const DEFAULT_INPUT: SinkInput = {
  goldPlatedKnobs: false,
  stainlessSteelFaucet: false,
  copperDrainPipe: false,
  hasHdmiPort: false,
};

export default function SinkSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [result, setResult] = useState<SinkOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ ...input, result, twitchCommand }), [input, result, twitchCommand]);

  useSolverModulePersistence<typeof moduleState & { input?: SinkInput }, SinkOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      const savedInput = state.input ?? state;
      setInput({
        goldPlatedKnobs: Boolean(savedInput.goldPlatedKnobs),
        stainlessSteelFaucet: Boolean(savedInput.stainlessSteelFaucet),
        copperDrainPipe: Boolean(savedInput.copperDrainPipe),
        hasHdmiPort: Boolean(savedInput.hasHdmiPort),
      });
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SINK, result: solution }));
    },
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveSink(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.SINK, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Sink"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, input, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setInput(DEFAULT_INPUT); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  const disabled = isLoading || isSolved;
  return <SolverLayout>
    <SolverSection title="Sink details" description="Select each condition that is visibly true. RJ-45 and all other bomb edgework are read automatically.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Check label="Gold-plated knobs" checked={input.goldPlatedKnobs} disabled={disabled} onChange={(value) => setInput({ ...input, goldPlatedKnobs: value })} />
        <Check label="Stainless steel faucet" checked={input.stainlessSteelFaucet} disabled={disabled} onChange={(value) => setInput({ ...input, stainlessSteelFaucet: value })} />
        <Check label="Copper drain pipe" checked={input.copperDrainPipe} disabled={disabled} onChange={(value) => setInput({ ...input, copperDrainPipe: value })} />
        <Check label="HDMI port present" checked={input.hasHdmiPort} disabled={disabled} onChange={(value) => setInput({ ...input, hasHdmiPort: value })} />
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find turn sequence" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Turn the knobs in order" className="border-emerald-500/40">
      <ol className="grid grid-cols-3 gap-3" aria-label="Sink knob sequence">
        {result.sequence.map((knob, index) => <li key={index} className={`rounded-lg border-2 p-4 text-center text-xl font-bold ${knob === "HOT" ? "border-red-500 bg-red-500/15 text-red-700 dark:text-red-300" : "border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"}`}>
          <span className="block text-xs font-medium opacity-70">{index + 1}</span>{knob === "HOT" ? "Hot" : "Cold"}
        </li>)}
      </ol>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Turn Hot or Cold once for each step. A wrong turn resets the sequence.</SolverInstructions>
  </SolverLayout>;
}

function Check({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-3 rounded-md border border-border p-3 text-sm font-medium">
    <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
    {label}
  </label>;
}
