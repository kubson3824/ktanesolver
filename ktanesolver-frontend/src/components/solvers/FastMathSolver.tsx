import { useCallback, useMemo, useState } from "react";
import { solveFastMath, type FastMathAction, type FastMathOutput } from "../../services/fastMathService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";
import { Button } from "../ui/button";

const LETTERS = "ABCDEGKNPSTXZ".split("");

function LetterSelect({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean }) {
  return <label className="space-y-1.5 text-sm font-medium">{label}
    <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="block h-12 w-full rounded-md border border-input bg-background px-3 text-lg font-bold">
      {LETTERS.map((letter) => <option key={letter}>{letter}</option>)}
    </select>
  </label>;
}

export default function FastMathSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [leftLetter, setLeftLetter] = useState(LETTERS[0]);
  const [rightLetter, setRightLetter] = useState(LETTERS[0]);
  const [result, setResult] = useState<FastMathOutput | null>(null);
  const [stage, setStage] = useState(0);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ leftLetter, rightLetter, result, stage, twitchCommand }), [leftLetter, rightLetter, result, stage, twitchCommand]);

  useSolverModulePersistence<typeof state, FastMathOutput>({
    state,
    onRestoreState: useCallback((saved: Partial<typeof state> & { lastPair?: string | null }) => {
      if (saved.leftLetter && LETTERS.includes(saved.leftLetter)) setLeftLetter(saved.leftLetter);
      else if (saved.lastPair?.length === 2) setLeftLetter(saved.lastPair[0]);
      if (saved.rightLetter && LETTERS.includes(saved.rightLetter)) setRightLetter(saved.rightLetter);
      else if (saved.lastPair?.length === 2) setRightLetter(saved.lastPair[1]);
      if (typeof saved.stage === "number") setStage(saved.stage);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: FastMathOutput) => {
      setStage(solution.stage);
      setResult(solution.answer ? solution : null);
      setTwitchCommand(solution.answer ? generateTwitchCommand({ moduleType: ModuleType.FAST_MATH, result: solution }) : "");
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const request = useCallback(async (action: FastMathAction) => {
    if (!round?.id || !bomb?.id || !currentModule?.id) throw new Error("Missing required information");
    return solveFastMath(round.id, bomb.id, currentModule.id, { action, leftLetter, rightLetter });
  }, [round?.id, bomb?.id, currentModule?.id, leftLetter, rightLetter]);

  const solveStage = useCallback(async () => {
    clearError(); setIsLoading(true);
    try {
      const response = await request("SOLVE_STAGE");
      const command = generateTwitchCommand({ moduleType: ModuleType.FAST_MATH, result: response.output });
      setResult(response.output); setStage(response.output.stage); setTwitchCommand(command);
      updateModuleAfterSolve(bomb!.id, currentModule!.id, { leftLetter, rightLetter, result: response.output, stage: response.output.stage, lastPair: leftLetter + rightLetter, twitchCommand: command }, response.output, false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Fast Math"); }
    finally { setIsLoading(false); }
  }, [bomb, currentModule, leftLetter, rightLetter, clearError, request, setError, setIsLoading, updateModuleAfterSolve]);

  const complete = useCallback(async () => {
    clearError(); setIsLoading(true);
    try {
      const response = await request("COMPLETE");
      setResult(response.output); setStage(response.output.stage); setIsSolved(true);
      markModuleSolved(bomb!.id, currentModule!.id);
      updateModuleAfterSolve(bomb!.id, currentModule!.id, state, response.output, true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to complete Fast Math"); }
    finally { setIsLoading(false); }
  }, [bomb, currentModule, state, clearError, markModuleSolved, request, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(async () => {
    clearError(); setIsLoading(true);
    try {
      const response = await request("RESET");
      setResult(null); setStage(0); setTwitchCommand(""); resetSolverState();
      updateModuleAfterSolve(bomb!.id, currentModule!.id, { leftLetter, rightLetter, result: null, stage: 0, lastPair: null, twitchCommand: "" }, response.output, false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to reset Fast Math"); }
    finally { setIsLoading(false); }
  }, [bomb, currentModule, leftLetter, rightLetter, clearError, request, resetSolverState, setError, setIsLoading, updateModuleAfterSolve]);

  const disabled = isLoading || isSolved;
  return <SolverLayout>
    <SolverSection title={`Stage ${stage + 1}`} description="Press GO, then select the two letters shown on the screen.">
      <div className="grid grid-cols-2 gap-3">
        <LetterSelect label="Left letter" value={leftLetter} onChange={setLeftLetter} disabled={disabled} />
        <LetterSelect label="Right letter" value={rightLetter} onChange={setRightLetter} disabled={disabled} />
      </div>
    </SolverSection>
    <SolverControls onSolve={solveStage} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText={`Solve stage ${stage + 1}`} />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Stage ${result.stage} answer`} className="border-emerald-500/40">
      <div className="text-center font-mono text-6xl font-black tracking-widest text-emerald-600">{result.answer}</div>
      {!isSolved && <Button type="button" variant="outline" className="mt-4 w-full" onClick={complete} disabled={isLoading}>Module disarmed after this answer</Button>}
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Submit both digits before the timer expires. If new letters appear, solve the next stage. If the module disarms, confirm it above; after a strike or timeout, use Reset because the module starts over.</SolverInstructions>
  </SolverLayout>;
}
