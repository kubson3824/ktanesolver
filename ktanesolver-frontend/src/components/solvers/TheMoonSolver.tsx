import { useCallback, useMemo, useState } from "react";
import { solveTheMoon, type TheMoonDirection, type TheMoonOutput } from "../../services/theMoonService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const DIRECTIONS: Array<{ value: TheMoonDirection; label: string }> = [
  { value: "NORTH", label: "North (top)" },
  { value: "NORTHEAST", label: "Northeast (top right)" },
  { value: "EAST", label: "East (right)" },
  { value: "SOUTHEAST", label: "Southeast (bottom right)" },
  { value: "SOUTH", label: "South (bottom)" },
  { value: "SOUTHWEST", label: "Southwest (bottom left)" },
  { value: "WEST", label: "West (left)" },
  { value: "NORTHWEST", label: "Northwest (top left)" },
];

export default function TheMoonSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [firstLitPosition, setFirstLitPosition] = useState<TheMoonDirection | "">("");
  const [result, setResult] = useState<TheMoonOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ firstLitPosition, result, twitchCommand }),
    [firstLitPosition, result, twitchCommand],
  );

  useSolverModulePersistence<typeof moduleState, TheMoonOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (DIRECTIONS.some(({ value }) => value === state.firstLitPosition)) setFirstLitPosition(state.firstLitPosition as TheMoonDirection);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      if (!solution?.pressSequence?.length) return;
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.THE_MOON, result: solution }));
    },
    currentModule,
    setIsSolved,
  });

  const changeFirstLitPosition = (value: TheMoonDirection | "") => {
    setFirstLitPosition(value);
    setResult(null);
    setTwitchCommand("");
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!firstLitPosition) return setError("Select the first lit set");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveTheMoon(round.id, bomb.id, currentModule.id, firstLitPosition);
      const command = generateTwitchCommand({ moduleType: ModuleType.THE_MOON, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id,
        { firstLitPosition, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve The Moon");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, firstLitPosition, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setFirstLitPosition("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="First lit set" description="Select the first of the four adjacent lit sets when reading clockwise.">
      <label className="mx-auto block max-w-sm text-sm font-medium">
        First lit set
        <select
          value={firstLitPosition}
          onChange={(event) => changeFirstLitPosition(event.target.value as TheMoonDirection | "")}
          disabled={isLoading || isSolved}
          className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3"
        >
          <option value="">Select a position…</option>
          {DIRECTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!firstLitPosition} solveText="Find sequence" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press in this order" className="border-emerald-500/40">
      <ol className="mx-auto max-w-md space-y-2">
        {result.pressSequence.map((press, index) => <li key={`${press}-${index}`} className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 capitalize">
          <span className="mr-3 font-bold text-emerald-700 dark:text-emerald-300">{index + 1}.</span>
          {press}
        </li>)}
      </ol>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Sets begin at the selected position and continue clockwise. Stop immediately if the sequence reaches the center button.</SolverInstructions>
  </SolverLayout>;
}
