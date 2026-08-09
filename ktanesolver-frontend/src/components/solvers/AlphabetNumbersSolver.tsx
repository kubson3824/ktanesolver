import { useCallback, useMemo, useState } from "react";
import { solveAlphabetNumbers, type AlphabetNumbersInput, type AlphabetNumbersOutput } from "../../services/alphabetNumbersService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

type SavedState = Partial<AlphabetNumbersInput> & { stage?: number; input?: Partial<AlphabetNumbersInput>; result?: AlphabetNumbersOutput | null; twitchCommand?: string };

export default function AlphabetNumbersSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState(1);
  const [labels, setLabels] = useState([1, 2, 3, 4, 5, 6]);
  const [result, setResult] = useState<AlphabetNumbersOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ stage, labels, result, twitchCommand }), [stage, labels, result, twitchCommand]);

  useSolverModulePersistence<SavedState, AlphabetNumbersOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      const input = saved.input ?? saved;
      if (saved.stage) setStage(saved.stage);
      if (input.labels?.length === 6) setLabels(input.labels);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: AlphabetNumbersOutput) => {
      setStage(4); setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.ALPHABET_NUMBERS, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const clearResult = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const input: AlphabetNumbersInput = { labels };
    clearError(); setIsLoading(true);
    try {
      const response = await solveAlphabetNumbers(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.ALPHABET_NUMBERS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      else { setStage(response.output.nextStage); setLabels([1, 2, 3, 4, 5, 6]); }
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        stage: response.output.nextStage, labels: response.solved ? labels : [1, 2, 3, 4, 5, 6], result: response.output, twitchCommand: command,
      }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Alphabet Numbers"); }
    finally { setIsLoading(false); }
  };
  const reset = () => {
    setStage(1); setLabels([1, 2, 3, 4, 5, 6]); setResult(null); setTwitchCommand(""); resetSolverState();
  };
  const maximum = stage === 1 ? 22 : stage === 4 ? 32 : 28;

  return <SolverLayout>
    <SolverSection title={`Stage ${stage} button labels`} description="Positions are Twitch Plays numbering: 1 is the top button, then continue clockwise through 6.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {labels.map((label, index) => <label key={index} className="text-sm font-medium">Position {index + 1}
          <input aria-label={`Position ${index + 1} label`} type="number" min={1} max={maximum} value={label} onChange={(event) => { const next = [...labels]; next[index] = Number(event.target.value); setLabels(next); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3" />
        </label>)}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Valid labels this stage: 1–{maximum}; all six must differ.</p>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText={stage === 4 ? "Solve module" : "Solve stage"} />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Stage ${result.stage} order`} className="border-emerald-500/40">
      <p className="text-center text-2xl font-bold">{result.presses.join(" → ")}</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>A strike is checked only after all six buttons and does not reroll the current labels. After a correct stage, wait for the new labels before solving the next stage.</SolverInstructions>
  </SolverLayout>;
}
