import { useCallback, useMemo, useState } from "react";

import {
  solveMarbleTumble, type MarbleColor, type MarbleTumbleInput, type MarbleTumbleOutput,
} from "../../services/marbleTumbleService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";

const COLORS: MarbleColor[] = ["RED", "YELLOW", "GREEN", "BLUE", "SILVER"];
const EMPTY_POSITIONS = Array<number>(5).fill(Number.NaN);

function PositionField({
  label, value, onChange, disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
}) {
  return <label className="space-y-1 text-xs font-medium">
    {label}
    <Input
      type="number"
      min={0}
      max={9}
      value={Number.isNaN(value) ? "" : value}
      onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
      disabled={disabled}
      className="text-center"
    />
  </label>;
}

export default function MarbleTumbleSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [colors, setColors] = useState<MarbleColor[]>([...COLORS]);
  const [safeGaps, setSafeGaps] = useState<number[]>([...EMPTY_POSITIONS]);
  const [trapPositions, setTrapPositions] = useState<number[]>([...EMPTY_POSITIONS]);
  const [result, setResult] = useState<MarbleTumbleOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ colors, safeGaps, trapPositions, result }),
    [colors, safeGaps, trapPositions, result],
  );

  useSolverModulePersistence<typeof moduleState, MarbleTumbleOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.colors?.length === 5) setColors(state.colors);
      if (state.safeGaps?.length === 5) setSafeGaps(state.safeGaps);
      if (state.trapPositions?.length === 5) setTrapPositions(state.trapPositions);
      if (state.result) setResult(state.result);
    },
    onRestoreSolution: setResult,
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    const positions = [...safeGaps, ...trapPositions];
    if (positions.some((position) => !Number.isInteger(position) || position < 0 || position > 9)) {
      return setError("Enter every safe gap and trap as a position from 0 to 9");
    }
    if (new Set(colors).size !== 5) return setError("Use each cylinder color exactly once");
    if (safeGaps.some((gap, index) => gap === trapPositions[index])) {
      return setError("A safe gap and trap cannot share a position");
    }
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const input: MarbleTumbleInput = { colors, safeGaps, trapPositions };
      const response = await solveMarbleTumble(round.id, bomb.id, currentModule.id, input);
      setResult(response.output);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id, { ...input, result: response.output }, response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Marble Tumble");
    } finally {
      setIsLoading(false);
    }
  }, [
    colors, safeGaps, trapPositions, round?.id, bomb?.id, currentModule?.id, clearError,
    markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve,
  ]);

  const reset = useCallback(() => {
    setColors([...COLORS]);
    setSafeGaps([...EMPTY_POSITIONS]);
    setTrapPositions([...EMPTY_POSITIONS]);
    setResult(null);
    resetSolverState();
  }, [resetSolverState]);

  const disabled = isLoading || isSolved;
  const twitchCommand = result
    ? generateTwitchCommand({ moduleType: ModuleType.MARBLE_TUMBLE, result })
    : "";

  return <SolverLayout>
    <SolverSection
      title="Cylinder layout"
      description="Work from the outermost cylinder inward. Position 0 is beneath the starting marble; count clockwise."
    >
      <div className="space-y-3" role="group" aria-label="Marble Tumble cylinders">
        {colors.map((color, index) => <div key={index} className="grid grid-cols-[auto_1fr_1fr] items-end gap-3">
          <label className="space-y-1 text-xs font-medium">
            {index + 1}. {index === 0 ? "Outermost" : index === 4 ? "Innermost" : "Cylinder"}
            <select
              value={color}
              onChange={(event) => setColors((values) =>
                values.map((value, i) => i === index ? event.target.value as MarbleColor : value))}
              disabled={disabled}
              aria-label={`Cylinder ${index + 1} color`}
              className="block h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {COLORS.map((option) =>
                <option key={option} value={option}>{option[0] + option.slice(1).toLowerCase()}</option>)}
            </select>
          </label>
          <PositionField
            label="Safe gap"
            value={safeGaps[index]}
            onChange={(value) => setSafeGaps((values) => values.map((current, i) => i === index ? value : current))}
            disabled={disabled}
          />
          <PositionField
            label="Trap"
            value={trapPositions[index]}
            onChange={(value) => setTrapPositions((values) => values.map((current, i) => i === index ? value : current))}
            disabled={disabled}
          />
        </div>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection
      title="Press on timer digits"
      description={result.instruction}
      className="border-emerald-500/40"
    >
      <p className="text-center text-3xl font-black">{result.timerDigits.join(" → ")}</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>
      Number the ten notch positions clockwise from 0 beneath the marble. Enter the center of each large safe gap and small trap.
    </SolverInstructions>
  </SolverLayout>;
}
