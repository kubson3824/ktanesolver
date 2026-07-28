import { useState } from "react";
import { solveLogicGates, type LogicGatesOutput } from "../../services/logicGatesService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverResult,
  SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const off = (count: number) => Array<boolean>(count).fill(false);

type PersistedState = {
  inputs?: boolean[];
  outputs?: boolean[];
  result?: LogicGatesOutput | null;
};

function LedInputs({
  label, values, onChange, disabled,
}: {
  label: string;
  values: boolean[];
  onChange: (values: boolean[]) => void;
  disabled: boolean;
}) {
  return <fieldset>
    <legend className="text-sm font-medium">{label}</legend>
    <div className="mt-2 flex flex-wrap gap-2">
      {values.map((lit, index) => <label
        key={index}
        className={`flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-full border px-3 text-sm font-semibold ${lit ? "border-emerald-500 bg-emerald-500 text-white" : "border-input bg-background"}`}
      >
        <input
          type="checkbox"
          checked={lit}
          onChange={() => onChange(values.map((value, position) => position === index ? !value : value))}
          disabled={disabled}
          className="sr-only"
        />
        {index + 1}
      </label>)}
    </div>
  </fieldset>;
}

export default function LogicGatesSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [inputs, setInputs] = useState(() => off(8));
  const [outputs, setOutputs] = useState(() => off(4));
  const [result, setResult] = useState<LogicGatesOutput | null>(null);
  const resetModule = useRoundStore((state) => state.resetModule);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();

  useSolverModulePersistence<PersistedState, LogicGatesOutput>({
    state: { inputs, outputs, result },
    onRestoreState: (state) => {
      if (state.inputs?.length === 8) setInputs(state.inputs);
      if (state.outputs?.length === 4) setOutputs(state.outputs);
      if (state.result !== undefined) setResult(state.result);
    },
    onRestoreSolution: setResult,
    currentModule,
    setIsSolved,
  });

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveLogicGates(round.id, bomb.id, currentModule.id, { inputs, outputs });
      setResult(response.output);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Logic Gates");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = async () => {
    if (bomb?.id && currentModule?.id) await resetModule(bomb.id, currentModule.id);
    setInputs(off(8));
    setOutputs(off(4));
    setResult(null);
    resetSolverState();
  };

  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.LOGIC_GATES, result }) : "";
  const identified = result?.gates.length === 7;

  return <SolverLayout>
    <SolverSection title="Displayed LEDs" description="Toggle every lit LED in the current configuration, numbered top to bottom.">
      <div className="space-y-4">
        <LedInputs label="Input row" values={inputs} onChange={setInputs} disabled={isLoading || isSolved} />
        <LedInputs label="Output row (gates A–D)" values={outputs} onChange={setOutputs} disabled={isLoading || isSolved} />
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={() => void reset()} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && !identified && <SolverResult
      title="Keep observing"
      description={result.candidates.map((gates, index) => `${String.fromCharCode(65 + index)}: ${gates.join("/")}`).join(" · ")}
    />}
    {result && identified && <SolverResult
      title={result.readyToCheck ? "Press CHECK" : "Cycle to the next configuration"}
      description={result.gates.map((gate, index) => `${String.fromCharCode(65 + index)}: ${gate}`).join(" · ")}
    />}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>
      Submit each displayed configuration, then press Next on the module and update the LEDs. The solver identifies A–D from the observations and checks the full circuit.
    </SolverInstructions>
  </SolverLayout>;
}
