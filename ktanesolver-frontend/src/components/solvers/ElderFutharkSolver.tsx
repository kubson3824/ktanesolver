import { useCallback, useMemo, useState } from "react";
import { ELDER_FUTHARK_RUNES, solveElderFuthark, type ElderFutharkOutput } from "../../services/elderFutharkService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function ElderFutharkSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [runes, setRunes] = useState(["Ansuz", "Berkana", "Kenaz"]), [result, setResult] = useState<ElderFutharkOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ runes, result, twitchCommand }), [runes, result, twitchCommand]);
  useSolverModulePersistence<typeof state, ElderFutharkOutput>({ state, onRestoreState: useCallback(saved => { if (saved.runes) setRunes(saved.runes); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []), onRestoreSolution: useCallback((solution: ElderFutharkOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.ELDER_FUTHARK, result: solution })); }, []), currentModule, setIsSolved });
  const changed = (index: number, value: string) => { setRunes(current => current.map((rune, position) => position === index ? value : rune)); setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveElderFuthark(round.id, bomb.id, currentModule.id, runes);
      const command = generateTwitchCommand({ moduleType: ModuleType.ELDER_FUTHARK, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved); if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { runes, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Elder Futhark"); } finally { setIsLoading(false); }
  };
  const reset = () => { setRunes(["Ansuz","Berkana","Kenaz"]); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Shown runes"><div className="grid gap-3 sm:grid-cols-3">{runes.map((rune,index)=><label key={index}>{["First","Second","Third"][index]} rune<select aria-label={`${["First","Second","Third"][index]} rune`} value={rune} onChange={event=>changed(index,event.target.value)} className="mt-1 h-11 w-full rounded border bg-background px-2">{ELDER_FUTHARK_RUNES.map(value=><option key={value}>{value}</option>)}</select></label>)}</div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Encrypt rune names"/><ErrorAlert error={error}/>
    {result&&<SolverSection title="Press these runes" className="border-emerald-500/40"><p className="text-sm text-muted-foreground">Encryption key: <span className="font-mono">{result.encryptionKey.toUpperCase()}</span></p>{result.encryptedRunes.map((sequence,index)=><p key={index} className="mt-3"><span className="font-semibold">Rune {index+1}:</span> {sequence.join(" → ")}</p>)}</SolverSection>}
    {twitchCommand&&<TwitchCommandDisplay command={twitchCommand}/>}<SolverInstructions>Identify the three displayed symbols using Appendix RAIDO and choose their names in shown order. The solver applies the default-rule Futhark table and preserves the original three runes for every Souvenir position question.</SolverInstructions>
  </SolverLayout>;
}
