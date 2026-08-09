import { useCallback, useMemo, useState } from "react";
import { DRAGON_ENERGY_WORDS, solveDragonEnergy, type DragonEnergyOutput } from "../../services/dragonEnergyService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function DragonEnergySolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [displayedWords, setDisplayedWords] = useState(["Angry", "Blessing", "Child"]);
  const [indicatorColor, setIndicatorColor] = useState("ORANGE");
  const [result, setResult] = useState<DragonEnergyOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ displayedWords, indicatorColor, result, twitchCommand }), [displayedWords, indicatorColor, result, twitchCommand]);
  useSolverModulePersistence<typeof state, DragonEnergyOutput>({ state, onRestoreState: useCallback((saved) => { if (saved.displayedWords) setDisplayedWords(saved.displayedWords); if (saved.indicatorColor) setIndicatorColor(saved.indicatorColor); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []), onRestoreSolution: useCallback((solution: DragonEnergyOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.DRAGON_ENERGY, result: solution })); }, []), currentModule, setIsSolved });
  const changed = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { displayedWords, indicatorColor };
      const response = await solveDragonEnergy(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.DRAGON_ENERGY, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Dragon Energy"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setDisplayedWords(["Angry", "Blessing", "Child"]); setIndicatorColor("ORANGE"); setResult(null); setTwitchCommand(""); resetSolverState(); };

  return <SolverLayout>
    <SolverSection title="Translated Mandarin words"><div className="grid gap-3 sm:grid-cols-3">{displayedWords.map((word, index) => <label key={index} className="text-sm font-medium">Word {index + 1}<select aria-label={`Translated word ${index + 1}`} value={word} onChange={(event) => { const next = [...displayedWords]; next[index] = event.target.value; setDisplayedWords(next); changed(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-2">{DRAGON_ENERGY_WORDS.map((option) => <option key={option}>{option}</option>)}</select></label>)}</div></SolverSection>
    <SolverSection title="Colored indicator"><select aria-label="Indicator color" value={indicatorColor} onChange={(event) => { setIndicatorColor(event.target.value); changed(); }} disabled={isLoading || isSolved} className="h-11 w-full rounded-md border border-input bg-background px-3"><option>ORANGE</option><option>CYAN</option><option>PURPLE</option></select></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find safe submission" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Safe submissions" className="border-emerald-500/40"><p className="text-sm text-muted-foreground">Swap scenario {result.swapScenario}</p><p className="mt-2"><strong>Words:</strong> {result.acceptableWords.join(", ")}</p><p className="mt-2"><strong>Timer digits:</strong> {result.safeTimerDigits.join(", ")}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Submit any listed word when the timer’s ones digit is listed. A strike regenerates the indicator and all three words, so replace this solver’s observation before retrying.</SolverInstructions>
  </SolverLayout>;
}
