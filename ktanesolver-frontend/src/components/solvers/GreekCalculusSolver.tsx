import { useCallback, useMemo, useState } from "react";

import {
  solveGreekCalculus,
  type GreekCalculusLedColor,
  type GreekCalculusOutput,
} from "../../services/greekCalculusService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverResult,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type DataPointDraft = { x: string; y: string };
const emptyPoints = (): DataPointDraft[] => Array.from({ length: 10 }, () => ({ x: "", y: "" }));
const LED_COLORS: Array<{ value: GreekCalculusLedColor; label: string }> = [
  { value: "GREEN", label: "Green" },
  { value: "RED", label: "Red" },
  { value: "BLUE", label: "Blue" },
  { value: "YELLOW", label: "Yellow" },
  { value: "OTHER", label: "Other color" },
];

interface PersistedState {
  dataPoints?: DataPointDraft[];
  blueParameter?: string;
  yellowParameter?: string;
  ledColor?: GreekCalculusLedColor;
  result?: GreekCalculusOutput | null;
  twitchCommand?: string;
}

export default function GreekCalculusSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [dataPoints, setDataPoints] = useState<DataPointDraft[]>(emptyPoints);
  const [blueParameter, setBlueParameter] = useState("");
  const [yellowParameter, setYellowParameter] = useState("");
  const [ledColor, setLedColor] = useState<GreekCalculusLedColor>("GREEN");
  const [result, setResult] = useState<GreekCalculusOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const complete = dataPoints.length >= 2
    && dataPoints.every((point) => point.x !== "" && Number.isInteger(Number(point.x)) && point.y.trim())
    && blueParameter.trim() && yellowParameter.trim();
  const moduleState = useMemo(() => ({
    dataPoints, blueParameter, yellowParameter, ledColor, result, twitchCommand,
  }), [dataPoints, blueParameter, yellowParameter, ledColor, result, twitchCommand]);

  useSolverModulePersistence<PersistedState, GreekCalculusOutput>({
    state: moduleState,
    onRestoreState: useCallback((state: PersistedState) => {
      if (state.dataPoints?.length) setDataPoints(state.dataPoints);
      if (state.blueParameter !== undefined) setBlueParameter(state.blueParameter);
      if (state.yellowParameter !== undefined) setYellowParameter(state.yellowParameter);
      if (state.ledColor !== undefined) setLedColor(state.ledColor);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: GreekCalculusOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.GREEK_CALCULUS, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const updatePoint = (index: number, patch: Partial<DataPointDraft>) => {
    setDataPoints((current) => current.map((point, position) => position === index ? { ...point, ...patch } : point));
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!complete) return setError("Enter at least two complete data points and both parameters");
    clearError();
    setIsLoading(true);
    try {
      const input = {
        dataPoints: dataPoints.map((point) => ({ x: Number(point.x), y: point.y.trim() })),
        blueParameter: blueParameter.trim(),
        yellowParameter: yellowParameter.trim(),
        ledColor,
      };
      const response = await solveGreekCalculus(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.GREEK_CALCULUS, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Greek Calculus");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, complete, dataPoints, blueParameter, yellowParameter, ledColor, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setDataPoints(emptyPoints());
    setBlueParameter("");
    setYellowParameter("");
    setLedColor("GREEN");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Data points" description="Enter every point in increasing x order. Y values may be integers or displayed Greek expressions such as α+2.">
      <div className="space-y-2">
        {dataPoints.map((point, index) => <div key={index} className="grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2">
          <span className="text-center text-sm font-semibold text-muted-foreground">{index + 1}</span>
          <Input type="number" step={1} value={point.x} onChange={(event) => updatePoint(index, { x: event.target.value })} disabled={isLoading || isSolved} aria-label={`Point ${index + 1} x value`} placeholder="x" />
          <Input value={point.y} onChange={(event) => updatePoint(index, { y: event.target.value })} disabled={isLoading || isSolved} aria-label={`Point ${index + 1} y value`} placeholder="y or α+2" />
          <Button type="button" variant="ghost" size="sm" onClick={() => setDataPoints((current) => current.filter((_, position) => position !== index))} disabled={isLoading || isSolved || dataPoints.length <= 2} aria-label={`Remove point ${index + 1}`}>−</Button>
        </div>)}
      </div>
      <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => setDataPoints((current) => [...current, { x: "", y: "" }])} disabled={isLoading || isSolved}>Add data point</Button>
    </SolverSection>

    <SolverSection title="Parameters and LED" description="Copy encoded parameters exactly as displayed; spaces are optional.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Blue parameter
          <Input value={blueParameter} onChange={(event) => setBlueParameter(event.target.value)} disabled={isLoading || isSolved} placeholder="β-1 or 3" className="mt-1" />
        </label>
        <label className="text-sm font-medium">Yellow parameter
          <Input value={yellowParameter} onChange={(event) => setYellowParameter(event.target.value)} disabled={isLoading || isSolved} placeholder="ω+2 or 5" className="mt-1" />
        </label>
      </div>
      <label className="mt-3 block text-sm font-medium">LED color
        <select value={ledColor} onChange={(event) => setLedColor(event.target.value as GreekCalculusLedColor)} disabled={isLoading || isSolved} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {LED_COLORS.map((color) => <option key={color.value} value={color.value}>{color.label}</option>)}
        </select>
      </label>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!complete} solveText="Calculate" />
    <ErrorAlert error={error} />
    {result && <SolverResult title={`Submit ${result.answer}`} description="Enter the absolute digits first, then NEG for a negative result, and press CHK." />}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Use the displayed x/y pairs and both colored parameters. The solver decodes all Greek symbols from the bomb edgework and applies the LED rule.</SolverInstructions>
  </SolverLayout>;
}
