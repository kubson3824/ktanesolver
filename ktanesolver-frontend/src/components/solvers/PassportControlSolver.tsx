import { useCallback, useMemo, useState } from "react";
import { solvePassportControl, type PassportControlOutput } from "../../services/passportControlService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function PassportControlSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [successfulPassages, setSuccessfulPassages] = useState(0), [arstotzkan, setArstotzkan] = useState(false), [flightType, setFlightType] = useState("ARRIVAL"), [birthDay, setBirthDay] = useState(1), [birthMonth, setBirthMonth] = useState(1), [birthYear, setBirthYear] = useState(1990), [expirationDay, setExpirationDay] = useState(1), [expirationMonth, setExpirationMonth] = useState(1), [expirationYear, setExpirationYear] = useState(2010), [result, setResult] = useState<PassportControlOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ successfulPassages, arstotzkan, flightType, birthDay, birthMonth, birthYear, expirationDay, expirationMonth, expirationYear, result, twitchCommand }), [successfulPassages, arstotzkan, flightType, birthDay, birthMonth, birthYear, expirationDay, expirationMonth, expirationYear, result, twitchCommand]);
  useSolverModulePersistence<typeof state, PassportControlOutput>({ state, onRestoreState: useCallback(saved => { if (saved.successfulPassages !== undefined) setSuccessfulPassages(saved.successfulPassages); if (saved.arstotzkan !== undefined) setArstotzkan(saved.arstotzkan); if (saved.flightType) setFlightType(saved.flightType); if (saved.birthDay) setBirthDay(saved.birthDay); if (saved.birthMonth) setBirthMonth(saved.birthMonth); if (saved.birthYear) setBirthYear(saved.birthYear); if (saved.expirationDay) setExpirationDay(saved.expirationDay); if (saved.expirationMonth) setExpirationMonth(saved.expirationMonth); if (saved.expirationYear) setExpirationYear(saved.expirationYear); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []), onRestoreSolution: useCallback((solution: PassportControlOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.PASSPORT_CONTROL, result: solution })); }, []), currentModule, setIsSolved });
  const changed = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solvePassportControl(round.id, bomb.id, currentModule.id, { successfulPassages, arstotzkan, flightType, birthDay, birthMonth, birthYear, expirationDay, expirationMonth, expirationYear });
      const command = generateTwitchCommand({ moduleType: ModuleType.PASSPORT_CONTROL, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...state, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Passport Control"); }
    finally { setIsLoading(false); }
  };
  const nextPassenger = () => { setSuccessfulPassages(count => count + 1); setResult(null); setTwitchCommand(""); clearError(); };
  const reset = () => { setSuccessfulPassages(0); setArstotzkan(false); setFlightType("ARRIVAL"); setBirthDay(1); setBirthMonth(1); setBirthYear(1990); setExpirationDay(1); setExpirationMonth(1); setExpirationYear(2010); setResult(null); setTwitchCommand(""); resetSolverState(); };
  const numberInput = (label: string, value: number, setter: (value: number) => void, min: number, max: number) => <label className="text-xs">{label}<input aria-label={label} type="number" min={min} max={max} value={value} onChange={event => { setter(Number(event.target.value)); changed(); }} className="mt-1 h-10 w-full rounded border bg-background px-2" /></label>;
  return <SolverLayout>
    <SolverSection title={`Passenger ${successfulPassages + 1} of 3`}><div className="grid gap-3 sm:grid-cols-2"><label>Travel direction<select aria-label="Travel direction" value={flightType} onChange={event => { setFlightType(event.target.value); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3"><option value="ARRIVAL">arrival</option><option value="DEPARTURE">departure</option></select></label><label className="flex items-center gap-2 pt-7"><input type="checkbox" checked={arstotzkan} onChange={event => { setArstotzkan(event.target.checked); changed(); }} />Ethnicity is Arstotzkan</label><fieldset className="rounded border p-2"><legend className="px-1">Date of birth (day/month/year)</legend><div className="grid grid-cols-3 gap-2">{numberInput("Birth day", birthDay, setBirthDay, 1, 31)}{numberInput("Birth month", birthMonth, setBirthMonth, 1, 12)}{numberInput("Birth year", birthYear, setBirthYear, 1800, 2200)}</div></fieldset><fieldset className="rounded border p-2"><legend className="px-1">Expiration (day/month/year)</legend><div className="grid grid-cols-3 gap-2">{numberInput("Expiration day", expirationDay, setExpirationDay, 1, 31)}{numberInput("Expiration month", expirationMonth, setExpirationMonth, 1, 12)}{numberInput("Expiration year", expirationYear, setExpirationYear, 1800, 2200)}</div></fieldset></div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Inspect passport" />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`${result.decision} passenger ${result.passageNumber}`} className={result.decision === "APPROVE" ? "border-emerald-500/40" : "border-red-500/40"}><p className="text-4xl font-bold">{result.decision}</p><p className="mt-2 text-sm">Rule date: {result.ruleDate}. Restrictions: {result.activeRestrictions.join(", ") || "none"}.</p><p className="text-sm text-muted-foreground">{result.reasons.join("; ")}.</p>{successfulPassages < 2 && <button type="button" onClick={nextPassenger} className="mt-4 rounded border px-3 py-2">Stamped correctly — next passenger</button>}</SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Use the approve or deny stamper shown by the result. A wrong stamp strikes and replaces the passenger, but previously successful passages remain. Three correct stamps solve the module. Passport Control is not a Souvenir candidate.</SolverInstructions>
  </SolverLayout>;
}
