import { useCallback, useMemo, useState } from "react";
import { solveDigitalCipher, type DigitalCipherOutput } from "../../services/digitalCipherService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function DigitalCipherSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [displayedString, setDisplayedString] = useState("");
  const [result, setResult] = useState<DigitalCipherOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ displayedString, result, twitchCommand }), [displayedString, result, twitchCommand]);
  useSolverModulePersistence<typeof state, DigitalCipherOutput>({ state, onRestoreState: useCallback(saved => { if (saved.displayedString) setDisplayedString(saved.displayedString); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []), onRestoreSolution: useCallback((solution: DigitalCipherOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.DIGITAL_CIPHER, result: solution })); }, []), currentModule, setIsSolved });
  const changed = (value: string) => { setDisplayedString(value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 15)); setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveDigitalCipher(round.id, bomb.id, currentModule.id, displayedString);
      const command = generateTwitchCommand({ moduleType: ModuleType.DIGITAL_CIPHER, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved); if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { displayedString, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Digital Cipher"); } finally { setIsLoading(false); }
  };
  const reset = () => { setDisplayedString(""); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Input screen"><label>15-letter string<input aria-label="Displayed string" value={displayedString} onChange={event => changed(event.target.value)} maxLength={15} className="mt-1 h-12 w-full rounded border bg-background px-3 font-mono text-xl tracking-widest uppercase" /></label></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={displayedString.length !== 15} solveText="Decode" /><ErrorAlert error={error} />
    {result && <SolverSection title="Press these buttons" className="border-emerald-500/40"><p className="break-all font-mono text-2xl tracking-widest">{result.pressSequence}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Copy the full upper-screen string. Each letter is paired with the letter mirrored from the other end; the solver converts every pair to its A–I input button.</SolverInstructions>
  </SolverLayout>;
}
