import { useCallback, useMemo, useState } from "react";
import { solveCharacterShift, type CharacterShiftOutput } from "../../services/characterShiftService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function CharacterShiftSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [letters, setLetters] = useState(["A", "B", "C", "D"]);
  const [digits, setDigits] = useState([0, 1, 2, 3]);
  const [result, setResult] = useState<CharacterShiftOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ letters, digits, result, twitchCommand }), [letters, digits, result, twitchCommand]);

  useSolverModulePersistence<typeof state, CharacterShiftOutput>({
    state,
    onRestoreState: useCallback((saved) => { if (saved.letters) setLetters(saved.letters); if (saved.digits) setDigits(saved.digits); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: CharacterShiftOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.CHARACTER_SHIFT, result: solution })); }, []),
    currentModule, setIsSolved,
  });
  const changed = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { letters, digits };
      const response = await solveCharacterShift(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.CHARACTER_SHIFT, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Character Shift"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setLetters(["A", "B", "C", "D"]); setDigits([0, 1, 2, 3]); setResult(null); setTwitchCommand(""); resetSolverState(); };

  return <SolverLayout>
    <SolverSection title="Displayed slider characters" description="Enter the four non-star values from each slider.">
      <div className="grid grid-cols-4 gap-3">{letters.map((letter, index) => <input key={`l${index}`} aria-label={`Letter ${index + 1}`} value={letter} maxLength={1} onChange={(event) => { const next = [...letters]; next[index] = event.target.value.toUpperCase(); setLetters(next); changed(); }} disabled={isLoading || isSolved} className="h-11 rounded-md border border-input bg-background text-center font-mono text-lg" />)}</div>
      <div className="mt-3 grid grid-cols-4 gap-3">{digits.map((digit, index) => <select key={`d${index}`} aria-label={`Digit ${index + 1}`} value={digit} onChange={(event) => { const next = [...digits]; next[index] = Number(event.target.value); setDigits(next); changed(); }} disabled={isLoading || isSolved} className="h-11 rounded-md border border-input bg-background px-2 text-center font-mono">{Array.from({ length: 10 }, (_, value) => <option key={value}>{value}</option>)}</select>)}</div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find valid pair" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Valid submissions" className="border-emerald-500/40">
      <p className="mb-3 text-sm text-muted-foreground">X = {result.x} · Y = {result.y}</p>
      <div className="flex flex-wrap gap-2">{result.solutions.map((solution) => <span key={`${solution.letter}${solution.digit}`} className="rounded-md border border-emerald-500 bg-emerald-500/15 px-3 py-2 font-mono"><strong>{solution.letter}{solution.digit}</strong> → {solution.shiftedLetter}</span>)}</div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Select any listed pair. The module submits automatically at its armed timer digit; a strike resets both sliders to *, but does not change their available characters.</SolverInstructions>
  </SolverLayout>;
}
