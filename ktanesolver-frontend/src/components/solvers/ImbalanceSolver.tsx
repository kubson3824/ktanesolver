import { useCallback, useMemo, useState } from "react";
import { solveImbalance, type ImbalanceOutput } from "../../services/imbalanceService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function ImbalanceSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [markers, setMarkers] = useState(["LEFT", "LEFT"]), [digits, setDigits] = useState(["", ""]);
  const [result, setResult] = useState<ImbalanceOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ markers, digits, result, twitchCommand }), [markers, digits, result, twitchCommand]);
  useSolverModulePersistence<typeof state, ImbalanceOutput>({
    state,
    onRestoreState: useCallback(saved => { if (saved.markers) setMarkers(saved.markers); if (saved.digits) setDigits(saved.digits); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: ImbalanceOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.IMBALANCE, result: solution })); }, []),
    currentModule, setIsSolved,
  });
  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const setMarker = (index: number, value: string) => { setMarkers(current => current.map((item, position) => position === index ? value : item)); changed(); };
  const setBarDigits = (index: number, value: string) => { setDigits(current => current.map((item, position) => position === index ? value : item)); changed(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (digits.some(value => !/^[12]{0,7}$/.test(value))) return setError("Use at most seven digits per bar, containing only 1 and 2");
    clearError(); setIsLoading(true);
    try {
      const response = await solveImbalance(round.id, bomb.id, currentModule.id, markers[0], digits[0], markers[1], digits[1]);
      const command = generateTwitchCommand({ moduleType: ModuleType.IMBALANCE, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { markers, digits, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Imbalance"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setMarkers(["LEFT", "LEFT"]); setDigits(["", ""]); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Displayed bars">
      {(["Top", "Bottom"] as const).map((label, index) => <div key={label} className={index ? "mt-4" : ""}>
        <p className="text-sm font-medium">{label} bar</p>
        <div className="mt-1 grid grid-cols-[9rem_1fr] gap-2">
          <label>Opening marker<select aria-label={`${label} bar marker`} value={markers[index]} onChange={event => setMarker(index, event.target.value)} className="mt-1 h-11 w-full rounded border bg-background px-2"><option value="LEFT">« left</option><option value="RIGHT">» right</option></select></label>
          <label>Digits<input aria-label={`${label} bar digits`} value={digits[index]} onChange={event => setBarDigits(index, event.target.value)} maxLength={7} inputMode="numeric" pattern="[12]*" placeholder="Leave blank if none" className="mt-1 h-11 w-full rounded border bg-background px-3" /></label>
        </div>
      </div>)}
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Decode and multiply" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press these timer digits" className="border-emerald-500/40"><p className="font-mono text-4xl font-bold">{result.answer}</p><p className="mt-2 text-sm">{result.topValue} × {result.bottomValue} = {result.answer}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Select the opening chevron and enter only the 1/2 digits between it and the final “.«”. Leave the digits blank when the bar is just “«.«” or “».«”. Press the module button when each answer digit appears on the timer. Imbalance is not supported by Souvenir.</SolverInstructions>
  </SolverLayout>;
}
