import { useCallback, useMemo, useState } from "react";

import { solveSynonyms, type SynonymsInput, type SynonymsOutput, type SynonymsPair } from "../../services/synonymsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Button } from "../ui/button";

const OKAY_WORDS = ["OK", "OKAY", "CONFIRM", "ENTER", "EXECUTE", "VERIFY", "SEND", "APPROVE", "SUBMIT", "SELECT", "YES"];
const CANCEL_WORDS = ["CANCEL", "ANNUL", "ERASE", "DELETE", "STOP", "OPPOSE", "DISCARD", "REJECT", "DECLINE", "REFUSE", "NO"];
const emptyPairs = (): SynonymsPair[] => Array.from({ length: 11 }, () => ({ okayWord: "", cancelWord: "" }));

export default function SynonymsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [displayedNumber, setDisplayedNumber] = useState<number | null>(null);
  const [pairs, setPairs] = useState<SynonymsPair[]>(emptyPairs);
  const [result, setResult] = useState<SynonymsOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ displayedNumber, pairs, result }), [displayedNumber, pairs, result]);

  useSolverModulePersistence<typeof state, SynonymsOutput>({
    state,
    onRestoreState: (saved) => {
      if(typeof saved.displayedNumber === "number") setDisplayedNumber(saved.displayedNumber);
      if(Array.isArray(saved.pairs) && saved.pairs.length === 11) setPairs(saved.pairs);
      if(saved.result) setResult(saved.result);
    },
    onRestoreSolution: setResult,
    currentModule,
    setIsSolved,
  });

  const updatePair = (index: number, key: keyof SynonymsPair, value: string) => {
    setPairs((current) => current.map((pair, position) => position === index ? { ...pair, [key]: value } : pair));
    setResult(null);
    clearError();
  };

  const solve = useCallback(async () => {
    if(displayedNumber === null) return setError("Select the displayed number");
    if(pairs.some((pair) => !pair.okayWord || !pair.cancelWord)) return setError("Enter all 11 word pairs");
    if(!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const input: SynonymsInput = { displayedNumber, pairs };
      const response = await solveSynonyms(round.id, bomb.id, currentModule.id, input);
      setResult(response.output);
      setIsSolved(response.solved);
      if(response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output }, response.output, response.solved);
    } catch(cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Synonyms");
    } finally {
      setIsLoading(false);
    }
  }, [displayedNumber, pairs, round?.id, bomb?.id, currentModule?.id, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setDisplayedNumber(null);
    setPairs(emptyPairs());
    setResult(null);
    resetSolverState();
  }, [resetSolverState]);

  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.SYNONYMS, result }) : "";

  return <SolverLayout>
    <SolverSection title="Displayed number">
      <div className="grid grid-cols-5 gap-2" role="group" aria-label="Displayed number">
        {Array.from({ length: 10 }, (_, number) => <Button key={number} type="button" variant={displayedNumber === number ? "default" : "outline"}
          onClick={() => { setDisplayedNumber(number); setResult(null); clearError(); }} disabled={isLoading || isSolved}>{number}</Button>)}
      </div>
    </SolverSection>
    <SolverSection title="Word pairs" description="Cycle once through the module and enter the pairs in the order shown.">
      <div className="space-y-2">
        {pairs.map((pair, index) => <div key={index} className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2">
          <span className="text-center text-sm text-muted-foreground">{index + 1}</span>
          <select aria-label={`Pair ${index + 1} Okay word`} value={pair.okayWord} onChange={(event) => updatePair(index, "okayWord", event.target.value)}
            disabled={isLoading || isSolved} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Okay word</option>
            {OKAY_WORDS.map((word) => <option key={word} value={word}>{word}</option>)}
          </select>
          <select aria-label={`Pair ${index + 1} Cancel word`} value={pair.cancelWord} onChange={(event) => updatePair(index, "cancelWord", event.target.value)}
            disabled={isLoading || isSolved} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Cancel word</option>
            {CANCEL_WORDS.map((word) => <option key={word} value={word}>{word}</option>)}
          </select>
        </div>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find button" />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Press ${result.targetWord}`} description={`Pair ${result.pairNumber}${result.noMatch ? " — no table pair matched" : ""}`} className="border-emerald-500/40">
      <p aria-live="polite" className="text-center text-4xl font-black">{result.targetWord}</p>
      <TwitchCommandDisplay command={twitchCommand} className="mt-4" />
    </SolverSection>}
    <SolverInstructions>The IND/serial and empty-port-plate exceptions are read from the bomb automatically.</SolverInstructions>
  </SolverLayout>;
}
