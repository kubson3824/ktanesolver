import { useCallback, useMemo, useState } from "react";
import {
  DOUBLE_COLOR_COLORS, solveDoubleColor,
  type DoubleColorColor, type DoubleColorInput, type DoubleColorOutput,
} from "../../services/doubleColorService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

type SavedState = Partial<DoubleColorInput> & { stage?: number; input?: Partial<DoubleColorInput>; result?: DoubleColorOutput | null; twitchCommand?: string };

export default function DoubleColorSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState(1);
  const [screenColor, setScreenColor] = useState<DoubleColorColor>("GREEN");
  const [newAttempt, setNewAttempt] = useState(false);
  const [result, setResult] = useState<DoubleColorOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ stage, screenColor, newAttempt, result, twitchCommand }),
    [stage, screenColor, newAttempt, result, twitchCommand]);

  useSolverModulePersistence<SavedState, DoubleColorOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      const input = saved.input ?? saved;
      if (saved.stage) setStage(saved.stage);
      if (input.screenColor) setScreenColor(input.screenColor);
      if (input.newAttempt !== undefined) setNewAttempt(input.newAttempt);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: DoubleColorOutput) => {
      setStage(2); setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.DOUBLE_COLOR, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const clearResult = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const input: DoubleColorInput = { screenColor, newAttempt };
    clearError(); setIsLoading(true);
    try {
      const response = await solveDoubleColor(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.DOUBLE_COLOR, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved); setNewAttempt(false);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      else setStage(response.output.nextStage);
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        stage: response.output.nextStage, screenColor, newAttempt: false, result: response.output, twitchCommand: command,
      }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Double Color"); }
    finally { setIsLoading(false); }
  };
  const reset = () => {
    setStage(1); setScreenColor("GREEN"); setNewAttempt(true); setResult(null); setTwitchCommand(""); resetSolverState();
  };

  return <SolverLayout>
    <SolverSection title={`Stage ${stage}`} description="Select the current large screen color; battery count is read from the bomb edgework.">
      <label className="block text-sm font-medium">Screen color
        <select aria-label="Screen color" value={screenColor} onChange={(event) => { setScreenColor(event.target.value as DoubleColorColor); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
          {DOUBLE_COLOR_COLORS.map((color) => <option key={color}>{color}</option>)}
        </select>
      </label>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText={stage === 2 ? "Solve module" : "Solve stage"} />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Stage ${result.stage} timing`} className="border-emerald-500/40">
      <p className="text-center text-2xl font-bold">Submit when the timer contains {result.digit}</p>
      <p className="mt-2 text-center text-sm text-red-600">Never submit while all three red squares are lit.</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>A wrong or dangerous submission resets the module to stage 1 with a new screen color. Use Reset here after any strike so successful-attempt state replaces the old colors.</SolverInstructions>
  </SolverLayout>;
}
