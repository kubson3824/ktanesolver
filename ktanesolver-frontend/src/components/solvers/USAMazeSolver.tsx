import { useCallback, useMemo, useState } from "react";
import { solveUSAMaze, type USAMazeOutput } from "../../services/usaMazeService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const STATES = [
  ["AK", "Alaska"], ["AL", "Alabama"], ["AR", "Arkansas"], ["AZ", "Arizona"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["FL", "Florida"], ["GA", "Georgia"],
  ["HI", "Hawaii"], ["IA", "Iowa"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["MA", "Massachusetts"], ["MD", "Maryland"],
  ["ME", "Maine"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MO", "Missouri"], ["MS", "Mississippi"],
  ["MT", "Montana"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["NE", "Nebraska"], ["NH", "New Hampshire"],
  ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NV", "Nevada"], ["NY", "New York"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VA", "Virginia"],
  ["VT", "Vermont"], ["WA", "Washington"], ["WI", "Wisconsin"], ["WV", "West Virginia"], ["WY", "Wyoming"],
];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface SavedState {
  currentState?: string;
  destinationState?: string;
  dayOfWeek?: string;
  input?: { currentState?: string; destinationState?: string; dayOfWeek?: string };
  result?: USAMazeOutput | null;
  twitchCommand?: string;
}

export default function USAMazeSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [currentState, setCurrentState] = useState("");
  const [destinationState, setDestinationState] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [result, setResult] = useState<USAMazeOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(
    () => ({ currentState, destinationState, dayOfWeek, result, twitchCommand }),
    [currentState, destinationState, dayOfWeek, result, twitchCommand],
  );

  useSolverModulePersistence<SavedState, USAMazeOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      setCurrentState(saved.input?.currentState ?? saved.currentState ?? "");
      setDestinationState(saved.input?.destinationState ?? saved.destinationState ?? "");
      setDayOfWeek(saved.input?.dayOfWeek ?? saved.dayOfWeek ?? "");
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: USAMazeOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.USA_MAZE, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const clearResult = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!currentState || !destinationState || !dayOfWeek) return setError("Select both states and the weekday");
    if (currentState === destinationState) return setError("Current and destination states must differ");
    clearError(); setIsLoading(true);
    try {
      const response = await solveUSAMaze(round.id, bomb.id, currentModule.id, currentState, destinationState, dayOfWeek);
      const command = generateTwitchCommand({ moduleType: ModuleType.USA_MAZE, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id,
        { currentState, destinationState, dayOfWeek, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve USA Maze"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, currentState, destinationState, dayOfWeek, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setCurrentState(""); setDestinationState(""); setDayOfWeek("");
    setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Route endpoints" description="Use the two-letter state abbreviations shown on the module.">
      <div className="grid gap-3 sm:grid-cols-2">
        {[["Current state", currentState, setCurrentState], ["Destination state", destinationState, setDestinationState]].map(([label, value, setter]) =>
          <label key={label as string} className="text-sm font-medium">{label as string}
            <select
              value={value as string} onChange={(event) => { (setter as (value: string) => void)(event.target.value); clearResult(); }}
              disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3"
            >
              <option value="">Select state</option>
              {STATES.map(([code, name]) => <option key={code} value={code}>{code} — {name}</option>)}
            </select>
          </label>)}
      </div>
      <label className="mt-3 block text-sm font-medium">Weekday used by the module
        <select value={dayOfWeek} onChange={(event) => { setDayOfWeek(event.target.value); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
          <option value="">Select weekday</option>{DAYS.map((day) => <option key={day}>{day}</option>)}
        </select>
      </label>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find route" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Shortest route" className="border-emerald-500/40">
      <p className="text-center font-semibold">{result.route.join(" → ")}</p>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2">
        {result.presses.map((shape, index) => <li key={`${shape}-${index}`} className="rounded-md border bg-muted/30 px-3 py-2">
          {result.route[index]} → {result.route[index + 1]}: <strong>{shape}</strong>
        </li>)}
      </ol>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>This solver uses the manual's default rule seed. For Alaska or Hawaii, use the bomb's weekday widget when exactly one exists; otherwise use the device's current weekday.</SolverInstructions>
  </SolverLayout>;
}
