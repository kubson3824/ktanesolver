import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import { solveBrokenButtons, type BrokenButtonsOutput } from "../../services/brokenButtonsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  StageIndicator,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";

type PersistedState = {
  labels?: string[];
  input?: { labels?: string[] };
  result?: BrokenButtonsOutput | null;
  twitchCommand?: string;
};

const EMPTY_GRID = () => Array.from({ length: 12 }, () => "");

export default function BrokenButtonsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [labels, setLabels] = useState<string[]>(EMPTY_GRID);
  const [result, setResult] = useState<BrokenButtonsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ labels, result, twitchCommand }), [labels, result, twitchCommand]);

  useSolverModulePersistence<PersistedState, BrokenButtonsOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      const restoredLabels = saved.labels ?? saved.input?.labels;
      if (restoredLabels?.length === 12) setLabels(restoredLabels.map((label) => label === "" ? "(blank)" : label));
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: BrokenButtonsOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.BROKEN_BUTTONS, result: solution }));
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (labels.some((label) => !label.trim())) return setError("Enter all 12 labels; use (blank) for a literally blank button");
    clearError(); setIsLoading(true);
    try {
      const response = await solveBrokenButtons(
        round.id, bomb.id, currentModule.id,
        labels.map((label) => label.trim().toLowerCase() === "(blank)" ? "" : label),
      );
      const command = generateTwitchCommand({ moduleType: ModuleType.BROKEN_BUTTONS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { labels, result: response.output, twitchCommand: command },
        response.output,
        response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Broken Buttons");
    } finally { setIsLoading(false); }
  }, [bomb?.id, clearError, currentModule?.id, labels, markModuleSolved, round?.id, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setLabels(EMPTY_GRID()); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);
  const targetIndex = result?.action === "PRESS_BUTTON" && result.row && result.column
    ? (result.row - 1) * 3 + result.column - 1
    : -1;

  return <SolverLayout>
    <SolverSection title="Button progress" description={`${result?.pressedCount ?? 0} of 5 buttons pressed before the forced submit.`}>
      <StageIndicator total={5} current={isSolved ? 6 : Math.min(5, (result?.pressedCount ?? 0) + 1)} completedThrough={result?.pressedCount ?? 0} />
    </SolverSection>
    {!isSolved && <SolverSection title="Current labels" description="Enter the 4 × 3 grid row by row. Type (blank) for a literally blank button; update the pressed button after its text changes.">
      <div className="mx-auto grid max-w-lg grid-cols-3 gap-3" role="grid" aria-label="Broken Buttons label grid">
        {labels.map((label, index) => <Input
          key={index}
          value={label}
          onChange={(event) => {
            setLabels((current) => current.map((value, item) => item === index ? event.target.value : value));
            if (error) clearError();
          }}
          disabled={isLoading}
          autoComplete="off"
          spellCheck={false}
          aria-label={`Row ${Math.floor(index / 3) + 1}, column ${index % 3 + 1}`}
          className={cn("text-center", targetIndex === index && "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500")}
        />)}
      </div>
    </SolverSection>}
    <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={labels.some((label) => !label.trim())} isLoading={isLoading} isSolved={isSolved} solveText={result ? "Find next press" : "Find first press"} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Instruction" className="border-emerald-500/40">
      <p className="text-center text-lg font-bold text-emerald-700 dark:text-emerald-400">
        {result.action === "SUBMIT"
          ? `Press the ${result.submitSide?.toLowerCase()} submit button.`
          : `Press row ${result.row}, column ${result.column}: ${result.label || "(blank)"}.`}
      </p>
      {result.action === "PRESS_BUTTON" && result.submitSide && <p className="mt-2 text-center font-semibold">
        Then press the {result.submitSide.toLowerCase()} submit button.
      </p>}
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Always use the first applicable rule. After a button press, replace that one label with its new text before finding the next press.</SolverInstructions>
  </SolverLayout>;
}
