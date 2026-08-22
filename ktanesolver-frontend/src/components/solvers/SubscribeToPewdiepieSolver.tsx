import { useCallback, useMemo, useState } from "react";
import { solveSubscribeToPewdiepie, type SubscribeToPewdiepieOutput } from "../../services/subscribeToPewdiepieService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function SubscribeToPewdiepieSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [pewdiepie, setPewdiepie] = useState(""), [tSeries, setTSeries] = useState("");
  const [result, setResult] = useState<SubscribeToPewdiepieOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ pewdiepie, tSeries, result, twitchCommand }), [pewdiepie, tSeries, result, twitchCommand]);
  useSolverModulePersistence<typeof state, SubscribeToPewdiepieOutput>({ state, onRestoreState: useCallback(saved => { if (saved.pewdiepie) setPewdiepie(saved.pewdiepie); if (saved.tSeries) setTSeries(saved.tSeries); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []), onRestoreSolution: useCallback((solution: SubscribeToPewdiepieOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SUBSCRIBE_TO_PEWDIEPIE, result: solution })); }, []), currentModule, setIsSolved });
  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!/^\d{8}$/.test(pewdiepie) || !/^\d{8}$/.test(tSeries)) return setError("Enter both eight-digit subscriber counts");
    clearError(); setIsLoading(true);
    try {
      const response = await solveSubscribeToPewdiepie(round.id, bomb.id, currentModule.id, Number(pewdiepie), Number(tSeries));
      const command = generateTwitchCommand({ moduleType: ModuleType.SUBSCRIBE_TO_PEWDIEPIE, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { pewdiepie, tSeries, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Subscribe to Pewdiepie"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setPewdiepie(""); setTSeries(""); setResult(null); setTwitchCommand(""); resetSolverState(); };
  const field = (label: string, value: string, setValue: (value: string) => void) => <label>{label}<input aria-label={label} inputMode="numeric" maxLength={8} value={value} onChange={event => { setValue(event.target.value.replace(/\D/g, "").slice(0, 8)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3 font-mono" /></label>;
  return <SolverLayout>
    <SolverSection title="Displayed subscriber counts"><div className="grid gap-3 sm:grid-cols-2">{field("PewDiePie", pewdiepie, setPewdiepie)}{field("T-Series", tSeries, setTSeries)}</div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate gap" /><ErrorAlert error={error} />
    {result && <SolverSection title="Submit this gap" className="border-emerald-500/40"><p className="font-mono text-5xl font-bold">{result.submission}</p><p className="mt-2 text-sm text-muted-foreground">Adjusted: PewDiePie {result.adjustedPewdiepie.toLocaleString()} · T-Series {result.adjustedTSeries.toLocaleString()}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Enter the top PewDiePie count and bottom T-Series count exactly as displayed. Souvenir may ask for either original count.</SolverInstructions>
  </SolverLayout>;
}
