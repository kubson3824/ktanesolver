import { useCallback, useMemo, useState } from "react";
import { solveChristmasPresents, type ChristmasPresentsCounts, type ChristmasPresentsOutput } from "../../services/christmasPresentsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const INITIAL: ChristmasPresentsCounts = { auntieMarge: 0, uncleSimon: 0, cousinBob: 0, grannyMay: 0, greatUncleBertie: 0 };
const LABELS: Record<keyof ChristmasPresentsCounts, string> = { auntieMarge: "Auntie Marge — dots", uncleSimon: "Uncle Simon — pink", cousinBob: "Cousin Bob — red", grannyMay: "Granny May — gold", greatUncleBertie: "Great Uncle Bertie — snowmen" };

export default function ChristmasPresentsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [counts, setCounts] = useState(INITIAL), [result, setResult] = useState<ChristmasPresentsOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(s => s.updateModuleAfterSolve);
  const state = useMemo(() => ({ counts, result, twitchCommand }), [counts, result, twitchCommand]);
  useSolverModulePersistence<typeof state, ChristmasPresentsOutput>({ state, onRestoreState: useCallback(s => { if (s.counts) setCounts(s.counts); if (s.result) setResult(s.result); if (s.twitchCommand) setTwitchCommand(s.twitchCommand); }, []), onRestoreSolution: useCallback((solution: ChristmasPresentsOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.CHRISTMAS_PRESENTS, result: solution })); }, []), currentModule, setIsSolved });
  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try { const response = await solveChristmasPresents(round.id, bomb.id, currentModule.id, counts); const command = generateTwitchCommand({ moduleType: ModuleType.CHRISTMAS_PRESENTS, result: response.output }); setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved); markModuleSolved(bomb.id, currentModule.id); updateModuleAfterSolve(bomb.id, currentModule.id, { counts, result: response.output, twitchCommand: command }, response.output, true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Christmas Presents"); } finally { setIsLoading(false); }
  };
  const reset = () => { setCounts(INITIAL); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout><SolverSection title="Presents by wrapping pattern"><div className="grid gap-3 sm:grid-cols-2">{(Object.keys(counts) as Array<keyof ChristmasPresentsCounts>).map(key => <label key={key}>{LABELS[key]}<input aria-label={LABELS[key]} type="number" min={0} max={13} value={counts[key]} onChange={e => { setCounts(current => ({ ...current, [key]: Number(e.target.value) })); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3" /></label>)}</div><p className="mt-3 text-sm">Total: {Object.values(counts).reduce((a,b) => a+b,0)} / 13</p></SolverSection><SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} /><ErrorAlert error={error} />{result && <SolverSection title="Press the clock during this hour" className="border-emerald-500/40"><p className="text-5xl font-bold">{result.hour.toString().padStart(2,"0")}:00–{result.hour.toString().padStart(2,"0")}:59</p><p className="mt-2 text-sm">X={result.valueX}, Y={result.valueY}, pre-modulo Z={result.valueZ}</p></SolverSection>}{twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}<SolverInstructions>The two larger physical boxes count as 2 and 3 presents, for 13 total. The clock cycles from 07 through 20. A wrong press strikes without changing the gifts. Christmas Presents is not a Souvenir candidate.</SolverInstructions></SolverLayout>;
}
