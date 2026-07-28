import { useCallback, useMemo, useState } from "react";
import {
  solveTheNumber,
  type TheNumberInput,
  type TheNumberOutput,
  type Weekday,
} from "../../services/theNumberService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Input } from "../ui";

const WEEKDAYS: Weekday[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

type PersistedState = {
  buttons: Array<number | null>;
  hasTwoFactor: boolean;
  startingTimeMinutes: number | null;
  startDay: Weekday;
  currentHour: number;
  timerBelowHalf: boolean;
  result: TheNumberOutput | null;
};

export default function TheNumberSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [buttons, setButtons] = useState<Array<number | null>>(Array(10).fill(null));
  const [hasTwoFactor, setHasTwoFactor] = useState(false);
  const [startingTimeMinutes, setStartingTimeMinutes] = useState<number | null>(null);
  const [startDay, setStartDay] = useState<Weekday>(WEEKDAYS[new Date().getDay()]);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [timerBelowHalf, setTimerBelowHalf] = useState(false);
  const [result, setResult] = useState<TheNumberOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo<PersistedState>(() => ({
    buttons, hasTwoFactor, startingTimeMinutes, startDay, currentHour, timerBelowHalf, result,
  }), [buttons, hasTwoFactor, startingTimeMinutes, startDay, currentHour, timerBelowHalf, result]);

  useSolverModulePersistence<PersistedState, TheNumberOutput>({
    state,
    onRestoreState: useCallback((saved: PersistedState & { input?: Partial<TheNumberInput> }) => {
      const input = saved.input ?? saved;
      if(Array.isArray(input.buttons)) setButtons(input.buttons);
      if(typeof input.hasTwoFactor === "boolean") setHasTwoFactor(input.hasTwoFactor);
      if(typeof input.startingTimeMinutes === "number") setStartingTimeMinutes(input.startingTimeMinutes);
      if(input.startDay && WEEKDAYS.includes(input.startDay)) setStartDay(input.startDay);
      if(typeof input.currentHour === "number") setCurrentHour(input.currentHour);
      if(typeof input.timerBelowHalf === "boolean") setTimerBelowHalf(input.timerBelowHalf);
      if(saved.result) setResult(saved.result);
    }, []),
    onRestoreSolution: useCallback((solution: TheNumberOutput) => {
      if(solution?.code) setResult(solution);
    }, []),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if(!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if(buttons.some((button) => button === null)) return setError("Enter all ten button labels");
    if(startingTimeMinutes === null) return setError("Enter the bomb's starting time");
    clearError();
    setIsLoading(true);
    try {
      const input: TheNumberInput = {
        buttons: buttons.map((button) => button!),
        hasTwoFactor,
        startingTimeMinutes,
        startDay,
        currentHour,
        timerBelowHalf,
      };
      const response = await solveTheNumber(round.id, bomb.id, currentModule.id, input);
      setResult(response.output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output }, response.output, true);
    } catch(cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve The Number");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, buttons, hasTwoFactor, startingTimeMinutes, startDay, currentHour, timerBelowHalf, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setButtons(Array(10).fill(null));
    setHasTwoFactor(false);
    setStartingTimeMinutes(null);
    setStartDay(WEEKDAYS[new Date().getDay()]);
    setCurrentHour(new Date().getHours());
    setTimerBelowHalf(false);
    setResult(null);
    resetSolverState();
  }, [resetSolverState]);

  const twitchCommand = result
    ? generateTwitchCommand({ moduleType: ModuleType.THE_NUMBER, result })
    : "";

  return <SolverLayout>
    <SolverSection title="Keypad" description="Enter the labels in reading order: top row, then bottom row.">
      <fieldset disabled={isLoading || isSolved}>
        <legend className="sr-only">Numbered button labels</legend>
        <div className="grid grid-cols-5 gap-2">
          {buttons.map((value, index) => <label key={index} className="text-center text-xs text-muted-foreground">
            Position {index + 1}
            <Input
              aria-label={`Button position ${index + 1}`}
              type="number"
              inputMode="numeric"
              min={0}
              max={9}
              value={value ?? ""}
              onChange={(event) => setButtons((current) => current.map((button, buttonIndex) =>
                buttonIndex === index ? (event.target.value === "" ? null : Number(event.target.value)) : button
              ))}
              className="mt-1 text-center"
            />
          </label>)}
        </div>
      </fieldset>
    </SolverSection>

    <SolverSection title="Submission snapshot" description="Use the current hour and timer state at the moment you will submit.">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium">Starting time (minutes)
          <Input aria-label="Starting time in minutes" type="number" min={1} value={startingTimeMinutes ?? ""} onChange={(event) => setStartingTimeMinutes(event.target.value === "" ? null : Number(event.target.value))} disabled={isLoading || isSolved} className="mt-1" />
        </label>
        <label className="text-sm font-medium">Start weekday
          <select aria-label="Start weekday" value={startDay} onChange={(event) => setStartDay(event.target.value as Weekday)} disabled={isLoading || isSolved} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            {WEEKDAYS.map((day) => <option key={day} value={day}>{day[0] + day.slice(1).toLowerCase()}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Current hour (0–23)
          <Input aria-label="Current hour" type="number" min={0} max={23} value={currentHour} onChange={(event) => setCurrentHour(Number(event.target.value))} disabled={isLoading || isSolved} className="mt-1" />
        </label>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
          <input type="checkbox" checked={hasTwoFactor} onChange={(event) => setHasTwoFactor(event.target.checked)} disabled={isLoading || isSolved} />
          Two Factor is present
        </label>
        <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
          <input type="checkbox" checked={timerBelowHalf} onChange={(event) => setTimerBelowHalf(event.target.checked)} disabled={isLoading || isSolved} />
          Timer is below half its starting time
        </label>
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate code" />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Enter this code" className="border-emerald-500/40">
      <p aria-live="polite" className="font-mono text-4xl font-bold tracking-[0.25em]">{result.code}</p>
      <p className="mt-2 text-sm text-muted-foreground">Press positions {result.buttonPositions.join(", ")}, then press E.</p>
      <TwitchCommandDisplay command={twitchCommand} className="mt-4" />
    </SolverSection>}

    <SolverInstructions>Positions are numbered 1–10 in reading order. C clears an entry; E submits it.</SolverInstructions>
  </SolverLayout>;
}
