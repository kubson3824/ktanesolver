import { useCallback, useMemo, useState } from "react";
import { solveSequences, type SequencesOutput } from "../../services/sequencesService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function SequencesSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [terms, setTerms] = useState(["", "", ""]);
  const [result, setResult] = useState<SequencesOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ terms, result, twitchCommand }), [terms, result, twitchCommand]);
  useSolverModulePersistence<typeof state, SequencesOutput>({
    state,
    onRestoreState: useCallback(saved => { if (saved.terms) setTerms(saved.terms); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: SequencesOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SEQUENCES, result: solution })); }, []),
    currentModule, setIsSolved,
  });
  const setTerm = (index: number, value: string) => {
    setTerms(current => current.map((term, position) => position === index ? value : term));
    setResult(null); setTwitchCommand(""); setIsSolved(false); clearError();
  };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (terms.some(term => !/^-?\d+$/.test(term))) return setError("Enter all three displayed integers");
    clearError(); setIsLoading(true);
    try {
      const response = await solveSequences(round.id, bomb.id, currentModule.id, Number(terms[0]), Number(terms[1]), Number(terms[2]));
      const command = generateTwitchCommand({ moduleType: ModuleType.SEQUENCES, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { terms, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Sequences"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setTerms(["", "", ""]); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="First three terms"><div className="grid grid-cols-3 gap-2">
      {terms.map((term, index) => <label key={index}>Term {index + 1}<input aria-label={`Term ${index + 1}`} type="number" value={term} onChange={event => setTerm(index, event.target.value)} className="mt-1 h-11 w-full rounded border bg-background px-3" /></label>)}
    </div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Derive formula" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Submit this formula" className="border-emerald-500/40"><p className="font-mono text-4xl font-bold">{result.formula}</p><p className="mt-2 text-sm">A = {result.coefficient}; B = {result.constant}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Enter the first three displayed terms from left to right. Submit the formula exactly as shown, with no spaces. A wrong formula strikes without changing the sequence. Souvenir currently only considers this module and asks no questions for it.</SolverInstructions>
  </SolverLayout>;
}
