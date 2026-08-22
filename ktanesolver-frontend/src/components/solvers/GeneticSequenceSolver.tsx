import { useCallback, useMemo, useState } from "react";
import { solveGeneticSequence, type GeneticSequenceOutput } from "../../services/geneticSequenceService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function GeneticSequenceSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [buttonOrder, setButtonOrder] = useState("ATCG"), [result, setResult] = useState<GeneticSequenceOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ buttonOrder, result, twitchCommand }), [buttonOrder, result, twitchCommand]);
  useSolverModulePersistence<typeof state, GeneticSequenceOutput>({
    state,
    onRestoreState: useCallback(saved => { if (saved.buttonOrder) setButtonOrder(saved.buttonOrder); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: GeneticSequenceOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.GENETIC_SEQUENCE, result: solution })); }, []),
    currentModule, setIsSolved,
  });
  const changed = (value: string) => { setButtonOrder(value.toUpperCase().replace(/[^ATCG]/g, "").slice(0, 4)); setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveGeneticSequence(round.id, bomb.id, currentModule.id, buttonOrder);
      const command = generateTwitchCommand({ moduleType: ModuleType.GENETIC_SEQUENCE, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { buttonOrder, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Genetic Sequence"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setButtonOrder("ATCG"); setResult(null); setTwitchCommand(""); resetSolverState(); };
  const grouped = (sequence: string) => sequence.match(/.{1,3}/g)?.join("-") ?? sequence;
  return <SolverLayout>
    <SolverSection title="Lettered buttons"><label>Labels from left to right<input aria-label="Button labels from left to right" value={buttonOrder} onChange={event => changed(event.target.value)} maxLength={4} placeholder="ATCG" className="mt-1 h-11 w-full rounded border bg-background px-3 font-mono uppercase tracking-[0.5em]" /></label></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Decode sequence" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="DNA solution" className="border-emerald-500/40">
      <p className="text-sm text-muted-foreground">{result.aminoAcids.join(" → ")} via {result.pathLabels.join(" → ")}</p>
      <p className="mt-2 text-3xl font-bold tracking-wider">{grouped(result.finalSequence)}</p>
      <p className="mt-1 text-sm">{result.templateStrand ? "Template strand (reverse complement)" : "Coding strand"}</p>
      <p className="mt-3 text-sm text-muted-foreground">Press positions: {result.pressPositions.join(" ")}, then OK.</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Enter the four visible letter labels from left to right. The solver applies the manual's lit/unlit indicator priority, prevents reuse of a path label, and reverse-complements the coding strand when required. Genetic Sequence is not a Souvenir candidate.</SolverInstructions>
  </SolverLayout>;
}
