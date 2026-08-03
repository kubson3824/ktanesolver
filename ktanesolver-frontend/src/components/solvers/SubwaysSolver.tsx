import { useCallback, useMemo, useState } from "react";
import {
  solveSubways,
  SUBWAYS_CITIES,
  SUBWAYS_COMMUTERS,
  SUBWAYS_DAYS,
  type SubwaysCity,
  type SubwaysCommuter,
  type SubwaysDay,
  type SubwaysInput,
  type SubwaysOutput,
} from "../../services/subwaysService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";

const labels: Record<string, string> = { NEW_YORK: "New York" };
const label = (value: string) => labels[value] ?? value[0] + value.slice(1).toLowerCase();

export default function SubwaysSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [city, setCity] = useState<SubwaysCity | "">("");
  const [commuter, setCommuter] = useState<SubwaysCommuter | "">("");
  const [day, setDay] = useState<SubwaysDay | "">("");
  const [result, setResult] = useState<SubwaysOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ city, commuter, day, result, twitchCommand }),
    [city, commuter, day, result, twitchCommand],
  );

  const onRestoreState = useCallback((state: Partial<typeof moduleState> & { input?: Partial<SubwaysInput> }) => {
    const input = state.input ?? state;
    if (input.city !== undefined) setCity(input.city);
    if (input.commuter !== undefined) setCommuter(input.commuter);
    if (input.day !== undefined) setDay(input.day);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: SubwaysOutput) => {
    if (!solution?.route || !solution.time || solution.stops?.length !== 3) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SUBWAYS, result: solution }));
  }, []);

  useSolverModulePersistence<typeof moduleState, SubwaysOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as SubwaysOutput & { output?: SubwaysOutput; result?: SubwaysOutput };
      return value.output ?? value.result ?? value;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!city || !commuter || !day) return setError("Select the city, commuter, and day");
    clearError();
    setIsLoading(true);
    try {
      const input: SubwaysInput = { city, commuter, day };
      const response = await solveSubways(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.SUBWAYS, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Subways");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, city, commuter, day, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setCity("");
    setCommuter("");
    setDay("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  const select = <T extends string>(title: string, value: T | "", values: readonly T[], onChange: (value: T) => void) => (
    <SolverSection title={title}>
      <select
        value={value}
        onChange={(event) => { onChange(event.target.value as T); clearError(); }}
        disabled={isLoading || isSolved}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        aria-label={title}
      >
        <option value="">Select {title.toLowerCase()}</option>
        {values.map((item) => <option key={item} value={item}>{label(item)}</option>)}
      </select>
    </SolverSection>
  );

  return (
    <SolverLayout>
      {select("City", city, SUBWAYS_CITIES, setCity)}
      {select("Commuter", commuter, SUBWAYS_COMMUTERS, setCommuter)}
      {select("Day", day, SUBWAYS_DAYS, setDay)}
      <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!city || !commuter || !day} isLoading={isLoading} isSolved={isSolved} />
      <ErrorAlert error={error} />

      {result && (
        <SolverSection title={`Route ${result.route}`} className="border-emerald-500/40">
          <p className="text-center text-lg font-semibold text-emerald-700 dark:text-emerald-400">Depart at {result.time}</p>
          <ol className="mt-3 list-decimal space-y-1 pl-6">
            {result.stops.map((stop) => <li key={stop}>{stop}</li>)}
          </ol>
        </SolverSection>
      )}
      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>Enter the city map, commuter name, and weekday shown on the module.</SolverInstructions>
    </SolverLayout>
  );
}
