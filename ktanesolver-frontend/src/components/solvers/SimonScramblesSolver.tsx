import { useCallback, useMemo, useState } from "react";
import { solveSimonScrambles, type SimonScramblesOutput } from "../../services/simonScramblesService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const COLORS = ["BLUE", "YELLOW", "RED", "GREEN"];
export default function SimonScramblesSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [flashes, setFlashes] = useState(Array<string>(10).fill("")), [result, setResult] = useState<SimonScramblesOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ flashes, result, twitchCommand }), [flashes, result, twitchCommand]);
  useSolverModulePersistence<typeof state, SimonScramblesOutput>({ state, onRestoreState: useCallback(saved => { if (saved.flashes) setFlashes(saved.flashes); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []), onRestoreSolution: useCallback((solution: SimonScramblesOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SIMON_SCRAMBLES, result: solution })); }, []), currentModule, setIsSolved });
  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (flashes.some(color => !color)) return setError("Select all 10 flash colors");
    clearError(); setIsLoading(true);
    try {
      const response = await solveSimonScrambles(round.id, bomb.id, currentModule.id, flashes);
      const command = generateTwitchCommand({ moduleType: ModuleType.SIMON_SCRAMBLES, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { flashes, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Simon Scrambles"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setFlashes(Array<string>(10).fill("")); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Flashing sequence"><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{flashes.map((color, index) => <label key={index}>Flash {index + 1}<select aria-label={`Flash ${index + 1} color`} value={color} onChange={event => { setFlashes(current => current.map((value, position) => position === index ? event.target.value : value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-2"><option value="">Select</option>{COLORS.map(value => <option key={value}>{value.toLowerCase()}</option>)}</select></label>)}</div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Translate flashes" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press these colors" className="border-emerald-500/40"><p className="text-2xl font-bold">{result.presses.join(" → ")}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Record the ten flashes in order. If the module strikes, discard the old entries because it generates a new sequence. Souvenir may ask for any of the ten original flashes.</SolverInstructions>
  </SolverLayout>;
}
