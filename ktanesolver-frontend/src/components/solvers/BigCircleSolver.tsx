import { useCallback, useMemo, useState } from "react";

import { solveBigCircle, type BigCircleInput, type BigCircleOutput } from "../../services/bigCircleService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const COLOR_CLASSES: Record<string, string> = {
  RED: "bg-red-600 text-white",
  ORANGE: "bg-orange-500 text-black",
  YELLOW: "bg-yellow-400 text-black",
  GREEN: "bg-green-600 text-white",
  BLUE: "bg-blue-600 text-white",
  MAGENTA: "bg-fuchsia-600 text-white",
  WHITE: "bg-white text-black",
  BLACK: "bg-black text-white",
};

export default function BigCircleSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [spinDirection, setSpinDirection] = useState("");
  const [twoFactorCodesText, setTwoFactorCodesText] = useState("");
  const [specialPortCount, setSpecialPortCount] = useState(0);
  const [result, setResult] = useState<BigCircleOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ spinDirection, twoFactorCodesText, specialPortCount, result, twitchCommand }),
    [spinDirection, twoFactorCodesText, specialPortCount, result, twitchCommand],
  );

  const onRestoreState = useCallback((state: Partial<typeof moduleState> & { input?: Partial<BigCircleInput> }) => {
    if (state.input?.spinDirection) setSpinDirection(state.input.spinDirection);
    else if (state.spinDirection) setSpinDirection(state.spinDirection);
    if (state.input?.twoFactorCodes) setTwoFactorCodesText(state.input.twoFactorCodes.join(", "));
    if (state.input?.specialPortCount !== undefined) setSpecialPortCount(state.input.specialPortCount);
    else if (state.specialPortCount !== undefined) setSpecialPortCount(state.specialPortCount);
    if (state.twoFactorCodesText !== undefined) setTwoFactorCodesText(state.twoFactorCodesText);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: BigCircleOutput) => {
    if (!solution) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.BIG_CIRCLE, result: solution }));
  }, []);

  useSolverModulePersistence<typeof moduleState, BigCircleOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as BigCircleOutput & { output?: BigCircleOutput };
      return value.output ?? value;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!spinDirection) return setError("Select the circle's spin direction");
    const twoFactorCodes = twoFactorCodesText.trim()
      ? twoFactorCodesText.trim().split(/[\s,]+/).map(Number)
      : [];
    if (twoFactorCodes.some((code) => !Number.isInteger(code) || code < 0 || code > 999999)) {
      return setError("Enter valid Two Factor codes separated by spaces or commas");
    }
    clearError();
    setIsLoading(true);
    try {
      const input = { spinDirection, twoFactorCodes, specialPortCount };
      const response = await solveBigCircle(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.BIG_CIRCLE, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id,
        { ...input, twoFactorCodesText, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Big Circle");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, spinDirection, twoFactorCodesText, specialPortCount, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setSpinDirection("");
    setTwoFactorCodesText("");
    setSpecialPortCount(0);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Spin direction" description="Observe the direction before pressing any wedge.">
      <fieldset className="flex flex-wrap gap-4">
        <legend className="sr-only">Spin direction</legend>
        {[["CLOCKWISE", "Clockwise"], ["COUNTERCLOCKWISE", "Counterclockwise"]].map(([value, label]) => <label key={value} className="flex items-center gap-2">
          <input type="radio" name="spinDirection" value={value} checked={spinDirection === value} onChange={() => { setSpinDirection(value); clearError(); }} disabled={isLoading || isSolved} />
          {label}
        </label>)}
      </fieldset>
    </SolverSection>

    <SolverSection title="Extra edgework" description="The bomb setup already supplies batteries, indicators, ports, serial number, and solved modules.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">Two Factor codes
          <input value={twoFactorCodesText} onChange={(event) => { setTwoFactorCodesText(event.target.value); clearError(); }} disabled={isLoading || isSolved} placeholder="123456, 900001" className="rounded-md border bg-background px-3 py-2 font-mono" />
        </label>
        <label className="grid gap-1 text-sm font-medium">Custom ports
          <input type="number" min={0} step={1} value={specialPortCount} onChange={(event) => { setSpecialPortCount(Math.max(0, Number(event.target.value))); clearError(); }} disabled={isLoading || isSolved} className="rounded-md border bg-background px-3 py-2" />
        </label>
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!spinDirection} isLoading={isLoading} isSolved={isSolved} solveText="Calculate colors" />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Press in order" description={result.bobException
      ? `BOB exception: using serial character ${result.serialCharacter}; any serial-character solution is valid.`
      : `Score ${result.score} bounces to serial position ${result.serialIndex} (${result.serialCharacter}).`} className="border-emerald-500/40">
      <ol className="flex flex-wrap justify-center gap-3">
        {result.pressSequence.map((color, index) => <li key={`${color}-${index}`} className={`flex h-24 w-24 items-center justify-center rounded-full border-4 border-background text-center text-sm font-bold shadow ${COLOR_CLASSES[color]}`}>
          <span><span className="block text-xs opacity-75">{index + 1}</span>{color}</span>
        </li>)}
      </ol>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Default rule seed only. Press the three shown colors in order. Recalculate before the first press if another module is solved or a Two Factor code changes.</SolverInstructions>
  </SolverLayout>;
}
