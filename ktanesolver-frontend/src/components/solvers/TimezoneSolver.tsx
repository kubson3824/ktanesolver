import { useCallback, useMemo, useState } from "react";
import {
  solveTimezone,
  TIMEZONE_CITIES,
  type TimezoneCity,
  type TimezoneInput,
  type TimezoneOutput,
  type TimezonePeriod,
} from "../../services/timezoneService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SegmentedControl,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";

const SELECT_CLASS = "mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export default function TimezoneSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [departureCity, setDepartureCity] = useState<TimezoneCity | "">("");
  const [destinationCity, setDestinationCity] = useState<TimezoneCity | "">("");
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<TimezonePeriod>("AM");
  const [twelveHour, setTwelveHour] = useState(true);
  const [result, setResult] = useState<TimezoneOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const savedState = useMemo(
    () => ({ departureCity, destinationCity, hour, minute, period, twelveHour, result }),
    [departureCity, destinationCity, hour, minute, period, twelveHour, result],
  );

  useSolverModulePersistence<typeof savedState, TimezoneOutput>({
    state: savedState,
    onRestoreState: useCallback((saved: Partial<typeof savedState> & { input?: Partial<TimezoneInput> }) => {
      const input = saved.input ?? saved;
      if (input.departureCity) setDepartureCity(input.departureCity);
      if (input.destinationCity) setDestinationCity(input.destinationCity);
      if (Number.isInteger(input.hour) && input.hour! >= 1 && input.hour! <= 12) setHour(input.hour!);
      if (Number.isInteger(input.minute) && input.minute! >= 0 && input.minute! <= 55 && input.minute! % 5 === 0) {
        setMinute(input.minute!);
      }
      if (input.period === "AM" || input.period === "PM") setPeriod(input.period);
      if (typeof input.twelveHour === "boolean") setTwelveHour(input.twelveHour);
      if (saved.result) setResult(saved.result);
    }, []),
    onRestoreSolution: useCallback((solution: TimezoneOutput) => {
      if (/^\d{4}$/.test(solution?.submission ?? "")) setResult(solution);
    }, []),
    currentModule,
    setIsSolved,
  });

  const valid = departureCity !== ""
    && destinationCity !== ""
    && departureCity !== destinationCity
    && Number.isInteger(hour)
    && hour >= 1
    && hour <= 12
    && Number.isInteger(minute)
    && minute >= 0
    && minute <= 55
    && minute % 5 === 0;
  const twitchCommand = result
    ? generateTwitchCommand({ moduleType: ModuleType.TIMEZONE, result })
    : "";
  const disabled = isLoading || isSolved;
  const change = () => { setResult(null); clearError(); };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!departureCity || !destinationCity) return setError("Select both cities");
    if (departureCity === destinationCity) return setError("Departure and destination cities must be different");
    if (!Number.isInteger(hour) || hour < 1 || hour > 12) return setError("Enter an hour from 1 to 12");
    if (!Number.isInteger(minute) || minute < 0 || minute > 55 || minute % 5 !== 0) {
      return setError("Enter minutes from 00 to 55 in five-minute steps");
    }

    clearError(); setIsLoading(true);
    try {
      const input: TimezoneInput = { departureCity, destinationCity, hour, minute, period, twelveHour };
      const response = await solveTimezone(round.id, bomb.id, currentModule.id, input);
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { ...input, result: response.output },
        response.output,
        response.solved,
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Timezone"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, departureCity, destinationCity, hour, minute, period, twelveHour, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setDepartureCity(""); setDestinationCity(""); setHour(12); setMinute(0);
    setPeriod("AM"); setTwelveHour(true); setResult(null); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Route" description="Select the city below the clock, then the destination city shown on the right.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Departure city
          <select
            aria-label="Departure city"
            value={departureCity}
            onChange={(event) => { setDepartureCity(event.target.value as TimezoneCity); change(); }}
            disabled={disabled}
            className={SELECT_CLASS}
          >
            <option value="">Select a city…</option>
            {TIMEZONE_CITIES.map((city) => <option key={city} value={city} disabled={city === destinationCity}>{city}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Destination city
          <select
            aria-label="Destination city"
            value={destinationCity}
            onChange={(event) => { setDestinationCity(event.target.value as TimezoneCity); change(); }}
            disabled={disabled}
            className={SELECT_CLASS}
          >
            <option value="">Select a city…</option>
            {TIMEZONE_CITIES.map((city) => <option key={city} value={city} disabled={city === departureCity}>{city}</option>)}
          </select>
        </label>
      </div>
    </SolverSection>

    <SolverSection title="Departure time" description="Enter the analog clock time and use the illuminated AM/PM label.">
      <div className="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2">
        <label className="text-sm font-medium">Hour
          <Input
            aria-label="Departure hour"
            type="number"
            min={1}
            max={12}
            value={hour}
            onChange={(event) => { setHour(Number(event.target.value)); change(); }}
            disabled={disabled}
            className="mt-1 h-10"
          />
        </label>
        <span className="pb-2 text-xl font-bold" aria-hidden>:</span>
        <label className="text-sm font-medium">Minute
          <Input
            aria-label="Departure minute"
            type="number"
            min={0}
            max={55}
            step={5}
            value={minute}
            onChange={(event) => { setMinute(Number(event.target.value)); change(); }}
            disabled={disabled}
            className="mt-1 h-10"
          />
        </label>
        <SegmentedControl
          value={period}
          onChange={(value) => { setPeriod(value as TimezonePeriod); change(); }}
          options={[{ value: "AM", label: "AM" }, { value: "PM", label: "PM" }]}
          disabled={disabled}
          ariaLabel="Departure time period"
          className="mb-0.5"
        />
      </div>
    </SolverSection>

    <SolverSection title="Requested format" description="Use the illuminated 12-hour or 24-hour label on the module.">
      <SegmentedControl
        value={twelveHour ? "TWELVE" : "TWENTY_FOUR"}
        onChange={(value) => { setTwelveHour(value === "TWELVE"); change(); }}
        options={[{ value: "TWELVE", label: "12-hour" }, { value: "TWENTY_FOUR", label: "24-hour" }]}
        disabled={disabled}
        ariaLabel="Requested output format"
        className="w-full"
      />
    </SolverSection>

    <SolverControls
      onSolve={solve}
      onReset={reset}
      isLoading={isLoading}
      isSolved={isSolved}
      isSolveDisabled={!valid}
      solveText="Convert time"
    />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Submit these four digits" className="border-emerald-500/40">
      <div className="rounded-xl border-4 border-sky-500/70 bg-slate-950 p-6 text-center text-white shadow-inner" role="status" aria-live="polite">
        <p className="font-mono text-5xl font-bold tracking-[0.2em] tabular-nums" aria-label={`Submission ${result.submission}`}>
          {result.submission}
        </p>
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Read the departure clock and both illuminated labels exactly as shown; enter all four result digits, including leading zeroes.</SolverInstructions>
  </SolverLayout>;
}
