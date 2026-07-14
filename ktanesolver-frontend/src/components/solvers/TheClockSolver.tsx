import { useCallback, useMemo, useState } from "react";
import {
  solveTheClock,
  type ClockCasingColor,
  type ClockHandStyle,
  type ClockNumeralColor,
  type ClockNumeralStyle,
  type ClockPeriod,
  type ClockTextColor,
  type TheClockOutput,
} from "../../services/theClockService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SegmentedControl, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";
import { Input } from "../ui/input";

const selectClass = "mt-1 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const label = (value: string) => value[0] + value.slice(1).toLowerCase();

export default function TheClockSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<ClockPeriod>("AM");
  const [numeralStyle, setNumeralStyle] = useState<ClockNumeralStyle>("ARABIC");
  const [casingColor, setCasingColor] = useState<ClockCasingColor>("GOLD");
  const [colorsMatch, setColorsMatch] = useState(true);
  const [handStyle, setHandStyle] = useState<ClockHandStyle>("SPADES");
  const [numeralColor, setNumeralColor] = useState<ClockNumeralColor>("RED");
  const [amPmTextColor, setAmPmTextColor] = useState<ClockTextColor>("WHITE");
  const [secondsHandPresent, setSecondsHandPresent] = useState(true);
  const [moreThanHalfRemaining, setMoreThanHalfRemaining] = useState(true);
  const [result, setResult] = useState<TheClockOutput | null>(null);
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ hour, minute, period, numeralStyle, casingColor, colorsMatch, handStyle, numeralColor, amPmTextColor, secondsHandPresent, moreThanHalfRemaining, result }), [hour, minute, period, numeralStyle, casingColor, colorsMatch, handStyle, numeralColor, amPmTextColor, secondsHandPresent, moreThanHalfRemaining, result]);
  const targetTime = result ? (moreThanHalfRemaining ? result.addTime : result.subtractTime) : "";
  const twitchCommand = targetTime ? generateTwitchCommand({ moduleType: ModuleType.THE_CLOCK, result: { targetTime } }) : "";

  useSolverModulePersistence<typeof state, TheClockOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (typeof saved.hour === "number") setHour(saved.hour);
      if (typeof saved.minute === "number") setMinute(saved.minute);
      if (saved.period) setPeriod(saved.period);
      if (saved.numeralStyle) setNumeralStyle(saved.numeralStyle);
      if (saved.casingColor) setCasingColor(saved.casingColor);
      if (typeof saved.colorsMatch === "boolean") setColorsMatch(saved.colorsMatch);
      if (saved.handStyle) setHandStyle(saved.handStyle);
      if (saved.numeralColor) setNumeralColor(saved.numeralColor);
      if (saved.amPmTextColor) setAmPmTextColor(saved.amPmTextColor);
      if (typeof saved.secondsHandPresent === "boolean") setSecondsHandPresent(saved.secondsHandPresent);
      if (typeof saved.moreThanHalfRemaining === "boolean") setMoreThanHalfRemaining(saved.moreThanHalfRemaining);
      if (saved.result) setResult(saved.result);
    }, []),
    onRestoreSolution: useCallback((solution: TheClockOutput) => setResult(solution), []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return setError("Enter a valid 12-hour clock time");
    clearError(); setIsLoading(true);
    try {
      const response = await solveTheClock(round.id, bomb.id, currentModule.id, { hour, minute, period, numeralStyle, casingColor, colorsMatch, handStyle, numeralColor, amPmTextColor, secondsHandPresent });
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...state, result: response.output }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Clock"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, hour, minute, period, numeralStyle, casingColor, colorsMatch, handStyle, numeralColor, amPmTextColor, secondsHandPresent, moreThanHalfRemaining, state, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => { setResult(null); resetSolverState(); }, [resetSolverState]);
  const disabled = isLoading || isSolved;

  return <SolverLayout>
    <SolverSection title="Displayed time" description="Enter the time currently shown on the module.">
      <div className="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2">
        <label className="text-sm font-medium">Hour<Input type="number" min={1} max={12} value={hour} onChange={(event) => setHour(Number(event.target.value))} disabled={disabled} className="mt-1 h-10" /></label>
        <span className="pb-2 text-xl font-bold" aria-hidden>:</span>
        <label className="text-sm font-medium">Minute<Input type="number" min={0} max={59} value={minute} onChange={(event) => setMinute(Number(event.target.value))} disabled={disabled} className="mt-1 h-10" /></label>
        <SegmentedControl value={period} onChange={setPeriod} options={[{ value: "AM", label: "AM" }, { value: "PM", label: "PM" }]} disabled={disabled} ariaLabel="AM or PM" className="mb-0.5" />
      </div>
    </SolverSection>

    <SolverSection title="Hours chart" description="Match the three hour-hand categories.">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium">Numerals<select value={numeralStyle} onChange={(event) => setNumeralStyle(event.target.value as ClockNumeralStyle)} disabled={disabled} className={selectClass}>{["NONE", "ARABIC", "ROMAN"].map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
        <label className="text-sm font-medium">Casing<select value={casingColor} onChange={(event) => setCasingColor(event.target.value as ClockCasingColor)} disabled={disabled} className={selectClass}>{["GOLD", "SILVER"].map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
        <div><span className="text-sm font-medium">Hands match numerals</span><SegmentedControl value={colorsMatch ? "YES" : "NO"} onChange={(value) => setColorsMatch(value === "YES")} options={[{ value: "YES", label: "Yes" }, { value: "NO", label: "No" }]} disabled={disabled} ariaLabel="Do hand and numeral colors match?" className="mt-1 w-full" /></div>
      </div>
    </SolverSection>

    <SolverSection title="Minutes chart" description="Match the four minute-hand categories.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Hand shape<select value={handStyle} onChange={(event) => setHandStyle(event.target.value as ClockHandStyle)} disabled={disabled} className={selectClass}>{["SPADES", "ARROWS", "LINES"].map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
        <label className="text-sm font-medium">Numerals / tickmarks color<select value={numeralColor} onChange={(event) => setNumeralColor(event.target.value as ClockNumeralColor)} disabled={disabled} className={selectClass}>{["RED", "GREEN", "BLUE", "GOLD", "BLACK"].map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
        <div><span className="text-sm font-medium">AM/PM text color</span><SegmentedControl value={amPmTextColor} onChange={(value) => setAmPmTextColor(value as ClockTextColor)} options={[{ value: "WHITE", label: "White" }, { value: "BLACK", label: "Black" }]} disabled={disabled} ariaLabel="AM/PM text color" className="mt-1 w-full" /></div>
        <div><span className="text-sm font-medium">Seconds hand</span><SegmentedControl value={secondsHandPresent ? "PRESENT" : "ABSENT"} onChange={(value) => setSecondsHandPresent(value === "PRESENT")} options={[{ value: "PRESENT", label: "Present" }, { value: "ABSENT", label: "Absent" }]} disabled={disabled} ariaLabel="Seconds hand presence" className="mt-1 w-full" /></div>
      </div>
    </SolverSection>

    <SolverSection title="Bomb timer" description="Use the timer state when you will press Submit.">
      <SegmentedControl value={moreThanHalfRemaining ? "MORE" : "HALF_OR_LESS"} onChange={(value) => setMoreThanHalfRemaining(value === "MORE")} options={[{ value: "MORE", label: "More than half remains" }, { value: "HALF_OR_LESS", label: "Half or less remains" }]} disabled={isLoading} ariaLabel="Bomb timer compared with original time" className="w-full" />
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Set and submit" className="border-emerald-500/40">
      <div className="rounded-xl border-4 border-amber-500/70 bg-slate-950 p-6 text-center text-white shadow-inner" role="status" aria-live="polite">
        <time className="font-mono text-4xl font-bold tabular-nums sm:text-5xl">{targetTime}</time>
        <p className="mt-2 text-sm text-slate-300">{moreThanHalfRemaining ? "Add" : "Subtract"} {result.offsetHours} h {result.offsetMinutes} min</p>
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Set the shown target and press Submit. If the bomb timer crosses the halfway point before submission, switch the timer option; the target updates immediately.</SolverInstructions>
  </SolverLayout>;
}
