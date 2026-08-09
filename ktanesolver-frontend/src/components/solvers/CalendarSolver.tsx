import { useCallback, useMemo, useState } from "react";
import { solveCalendar, type CalendarOutput } from "../../services/calendarService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Input } from "../ui";

const COLORS = ["Green", "Yellow", "Red", "Blue"];
const HOLIDAYS = [
  "Christmas Eve", "Day of the Dead", "Bastille Day", "Golden Week", "Australia Day", "Republic Day",
  "Epiphany", "Earth Day", "Day of German Unity", "Cinco de Mayo", "Veterans Day", "Guy Fawkes Night",
  "Saint Patrick’s Day", "World Braille Day", "Kwanzaa", "Valentine’s Day", "April Fools’", "Groundhog Day",
];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface SavedState {
  activationDate?: string;
  ledColor?: string;
  holiday?: string;
  leapYear?: boolean;
  input?: { activationMonth?: number; activationDay?: number; ledColor?: string; holiday?: string; leapYear?: boolean };
  result?: CalendarOutput | null;
  twitchCommand?: string;
}

export default function CalendarSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [activationDate, setActivationDate] = useState("");
  const [ledColor, setLedColor] = useState("");
  const [holiday, setHoliday] = useState("");
  const [leapYear, setLeapYear] = useState(false);
  const [result, setResult] = useState<CalendarOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(
    () => ({ activationDate, ledColor, holiday, leapYear, result, twitchCommand }),
    [activationDate, ledColor, holiday, leapYear, result, twitchCommand],
  );

  useSolverModulePersistence<SavedState, CalendarOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (saved.input?.activationMonth && saved.input.activationDay) {
        setActivationDate(`2000-${String(saved.input.activationMonth).padStart(2, "0")}-${String(saved.input.activationDay).padStart(2, "0")}`);
        if (saved.input.ledColor) setLedColor(saved.input.ledColor);
        if (saved.input.holiday) setHoliday(saved.input.holiday);
        if (typeof saved.input.leapYear === "boolean") setLeapYear(saved.input.leapYear);
      } else {
        if (saved.activationDate !== undefined) setActivationDate(saved.activationDate);
        if (saved.ledColor !== undefined) setLedColor(saved.ledColor);
        if (saved.holiday !== undefined) setHoliday(saved.holiday);
        if (typeof saved.leapYear === "boolean") setLeapYear(saved.leapYear);
      }
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: CalendarOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.CALENDAR, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const clearResult = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const [, month, day] = activationDate.split("-").map(Number);
    if (!month || !day || !ledColor || !holiday) return setError("Enter the activation date, LED color, and holiday");
    clearError(); setIsLoading(true);
    try {
      const response = await solveCalendar(round.id, bomb.id, currentModule.id, {
        activationMonth: month, activationDay: day, ledColor, holiday, leapYear,
      });
      const command = generateTwitchCommand({ moduleType: ModuleType.CALENDAR, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id,
        { activationDate, ledColor, holiday, leapYear, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Calendar"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, activationDate, ledColor, holiday, leapYear, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setActivationDate(""); setLedColor(""); setHoliday(""); setLeapYear(false);
    setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Activation date" description="Use the local date when the bomb was activated.">
      <Input type="date" value={activationDate} onChange={(event) => { setActivationDate(event.target.value); clearResult(); }} disabled={isLoading || isSolved} aria-label="Bomb activation date" />
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={leapYear} onChange={(event) => { setLeapYear(event.target.checked); clearResult(); }} disabled={isLoading || isSolved} />
        The module's February has 29 days
      </label>
    </SolverSection>
    <SolverSection title="Module display">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">LED color
          <select value={ledColor} onChange={(event) => { setLedColor(event.target.value); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
            <option value="">Select color</option>{COLORS.map((color) => <option key={color}>{color}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Marked holiday
          <select value={holiday} onChange={(event) => { setHoliday(event.target.value); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
            <option value="">Select holiday</option>{HOLIDAYS.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find date" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Target date" className="border-emerald-500/40">
      <p className="text-center text-xl font-bold">{MONTHS[result.targetMonth - 1]} {result.targetDay}</p>
      <p className="mt-2 text-center">Press that day {result.pressCount === 1 ? "once" : `${result.pressCount} times`}.</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The calendar starts on January. Navigate to the target month, then press the shown day. Groundhog Day intentionally plays two fake strike sounds.</SolverInstructions>
  </SolverLayout>;
}
