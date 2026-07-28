import { useCallback, useMemo, useState } from "react";
import { solveTheSun, type TheSunDirection, type TheSunOutput } from "../../services/theSunService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const DIRECTIONS: Array<{ value: TheSunDirection; label: string }> = [
  { value: "NORTH", label: "North (top)" },
  { value: "NORTHEAST", label: "Northeast (top right)" },
  { value: "EAST", label: "East (right)" },
  { value: "SOUTHEAST", label: "Southeast (bottom right)" },
  { value: "SOUTH", label: "South (bottom)" },
  { value: "SOUTHWEST", label: "Southwest (bottom left)" },
  { value: "WEST", label: "West (left)" },
  { value: "NORTHWEST", label: "Northwest (top left)" },
];

export default function TheSunSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [ledPosition, setLedPosition] = useState<TheSunDirection | "">("");
  const [result, setResult] = useState<TheSunOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ ledPosition, result, twitchCommand }), [ledPosition, result, twitchCommand]);

  useSolverModulePersistence<typeof moduleState, TheSunOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (DIRECTIONS.some(({ value }) => value === state.ledPosition)) setLedPosition(state.ledPosition as TheSunDirection);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      if (!solution?.pressSequence?.length) return;
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.THE_SUN, result: solution }));
    },
    currentModule,
    setIsSolved,
  });

  const changeLedPosition = (value: TheSunDirection | "") => {
    setLedPosition(value);
    setResult(null);
    setTwitchCommand("");
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!ledPosition) return setError("Select the LED position");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveTheSun(round.id, bomb.id, currentModule.id, ledPosition);
      const command = generateTwitchCommand({ moduleType: ModuleType.THE_SUN, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id,
        { ledPosition, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve The Sun");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, ledPosition, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setLedPosition("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="LED position" description="Select the compass point containing the lit LED.">
      <label className="mx-auto block max-w-sm text-sm font-medium">
        Lit LED
        <select
          value={ledPosition}
          onChange={(event) => changeLedPosition(event.target.value as TheSunDirection | "")}
          disabled={isLoading || isSolved}
          className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3"
        >
          <option value="">Select a position…</option>
          {DIRECTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!ledPosition} solveText="Find sequence" />
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
    <SolverInstructions>Sets begin at north and continue clockwise. Stop immediately if the sequence reaches the center button.</SolverInstructions>
  </SolverLayout>;
}
