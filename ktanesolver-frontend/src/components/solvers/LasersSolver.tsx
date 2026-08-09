import { useCallback, useMemo, useState } from "react";
import { solveLasers, type LasersOutput } from "../../services/lasersService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Input } from "../ui";

const DEFAULT_LABELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const POSITIONS = ["Top left", "Top middle", "Top right", "Middle left", "Center", "Middle right", "Bottom left", "Bottom middle", "Bottom right"];
const COLORS = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple", "White"];

export default function LasersSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [labels, setLabels] = useState(DEFAULT_LABELS);
  const [startingTimeMinutes, setStartingTimeMinutes] = useState(5);
  const [result, setResult] = useState<LasersOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const savedState = useMemo(
    () => ({ labels, startingTimeMinutes, result, twitchCommand }),
    [labels, startingTimeMinutes, result, twitchCommand],
  );

  useSolverModulePersistence<typeof savedState, LasersOutput>({
    state: savedState,
    onRestoreState: useCallback((saved) => {
      if (saved.labels?.length === 9) setLabels(saved.labels);
      if (Number.isInteger(saved.startingTimeMinutes)) setStartingTimeMinutes(saved.startingTimeMinutes);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: LasersOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.LASERS, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const clearResult = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const changeLabel = (index: number, label: number) => {
    setLabels((current) => current.map((value, position) => position === index ? label : value));
    clearResult();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (new Set(labels).size !== 9) return setError("Enter each hatch label from 1 to 9 exactly once");
    if (!Number.isInteger(startingTimeMinutes) || startingTimeMinutes < 0) return setError("Enter the bomb's starting time in whole minutes");
    clearError(); setIsLoading(true);
    try {
      const response = await solveLasers(round.id, bomb.id, currentModule.id, labels, startingTimeMinutes);
      const command = generateTwitchCommand({ moduleType: ModuleType.LASERS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id,
        { labels, startingTimeMinutes, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Lasers"); }
    finally { setIsLoading(false); }
  }, [
    round?.id, bomb?.id, currentModule?.id, labels, startingTimeMinutes, clearError,
    markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve,
  ]);

  const reset = useCallback(() => {
    setLabels(DEFAULT_LABELS); setStartingTimeMinutes(5); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Hatch labels" description="Enter the labels in their original positions.">
      <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
        {labels.map((label, index) => <label key={index} className="text-center text-xs text-muted-foreground">
          {POSITIONS[index]}
          <select
            value={label}
            onChange={(event) => changeLabel(index, Number(event.target.value))}
            disabled={isLoading || isSolved}
            aria-label={`${POSITIONS[index]} hatch label`}
            className="mt-1 h-12 w-full rounded-md border border-input bg-background text-center text-lg font-bold"
          >
            {DEFAULT_LABELS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>)}
      </div>
      <label className="mt-4 block text-sm font-medium">Starting time in whole minutes
        <Input
          type="number" min={0} step={1} value={startingTimeMinutes}
          onChange={(event) => { setStartingTimeMinutes(event.target.valueAsNumber); clearResult(); }}
          disabled={isLoading || isSolved} className="mt-1" aria-label="Starting time in whole minutes"
        />
      </label>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find safe path" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Open these hatches" className="border-emerald-500/40">
      <ol className="grid gap-2 sm:grid-cols-2">
        {COLORS.map((color, index) => <li key={color} className="rounded-md border bg-muted/30 px-3 py-2">
          <span className="font-semibold">{color}</span>: position {result.positions[index]} (label {result.labels[index]})
        </li>)}
      </ol>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Positions are numbered 1–9 in reading order. Use the timer's original whole-minute value.</SolverInstructions>
  </SolverLayout>;
}
