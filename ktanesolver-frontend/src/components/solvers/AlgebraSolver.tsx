import { useCallback, useMemo, useState } from "react";
import { solveAlgebra, type AlgebraOutput } from "../../services/algebraService";
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

const EQUATIONS = [
  ["a=x+1", "a=6-x", "a=7x", "a=x/2", "a=5+y", "a=y-2", "a=8y", "a=y/4", "a=9+z", "a=z-7", "a=3z", "a=z/10"],
  ["b=xy-(2+x)", "b=(2x/10)-y", "b=(z-y)/2", "b=xyz", "b=(y/2)-z", "b=(zy)-(2x)", "b=(x+y)-(z/2)", "b=(7x)y", "b=2z+7", "b=2(z+7)"],
  ["x-2y=c-z", "xy=z+(c/10)", "(y/2)+7=4c+z", "8x-z=c-y", "3x-(2+y)/10=z/4-c", "9y/2=c-xy/4", "x(y/2)+11=(4+c)/2y", "z/2-x/4=4c-z"],
] as const;

type SavedState = {
  stage?: number;
  equations?: string[];
  equation?: string;
  result?: AlgebraOutput | null;
};

export default function AlgebraSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState(0);
  const [equations, setEquations] = useState<string[]>([]);
  const [equation, setEquation] = useState("");
  const [result, setResult] = useState<AlgebraOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const savedState = useMemo(() => ({ stage, equations, equation, result }), [stage, equations, equation, result]);

  useSolverModulePersistence<SavedState, AlgebraOutput>({
    state: savedState,
    onRestoreState: useCallback((saved) => {
      if (Number.isInteger(saved.stage) && saved.stage! >= 0 && saved.stage! <= 3) setStage(saved.stage!);
      if (Array.isArray(saved.equations)) setEquations(saved.equations);
      if (typeof saved.equation === "string") setEquation(saved.equation);
      if (saved.result) setResult(saved.result);
    }, []),
    onRestoreSolution: useCallback((solution: AlgebraOutput) => {
      if (solution && solution.stage >= 1 && solution.stage <= 3 && typeof solution.answer === "string") {
        setResult(solution);
      }
    }, []),
    currentModule,
    setIsSolved,
  });

  const currentStage = Math.min(stage + 1, 3);
  const options = EQUATIONS[Math.min(stage, 2)];
  const twitchCommand = result
    ? generateTwitchCommand({ moduleType: ModuleType.ALGEBRA, result })
    : "";

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!equation) return setError("Select the displayed equation");
    clearError(); setIsLoading(true);
    try {
      const response = await solveAlgebra(round.id, bomb.id, currentModule.id, { equation });
      const nextEquations = [...equations, response.output.equation];
      setStage(response.output.stage); setEquations(nextEquations); setEquation(""); setResult(response.output);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        stage: response.output.stage,
        equations: nextEquations,
        firstEquation: nextEquations[0],
        ...(nextEquations[1] ? { secondEquation: nextEquations[1] } : {}),
        equation: "",
        result: response.output,
      }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Algebra"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, equation, equations, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  return <SolverLayout>
    <SolverSection title="Progress" description="Each correct answer reveals the next equation.">
      <StageIndicator total={3} current={currentStage} completedThrough={stage} />
    </SolverSection>

    {!isSolved && <SolverSection title={`Stage ${currentStage} equation`} description="Select the equation exactly as it appears on the upper screen.">
      <label className="space-y-1.5 text-sm font-medium">Displayed equation
        <select
          aria-label="Displayed equation"
          value={equation}
          onChange={(event) => { setEquation(event.target.value); clearError(); }}
          disabled={isLoading}
          className="block h-12 w-full rounded-md border border-input bg-background px-3 font-mono text-base"
        >
          <option value="">Select an equation…</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    </SolverSection>}

    <SolverControls
      onSolve={solve}
      onReset={() => undefined}
      isLoading={isLoading}
      isSolved={isSolved}
      isSolveDisabled={!equation}
      solveText={`Solve stage ${currentStage}`}
      showReset={false}
    />
    <ErrorAlert error={error} />

    {result && <SolverSection title={`Stage ${result.stage} answer`} className="border-emerald-500/40">
      <div className="rounded-xl border-4 border-sky-500/70 bg-slate-950 p-6 text-center text-white shadow-inner" role="status" aria-live="polite">
        <p className="font-mono text-5xl font-bold tracking-wide tabular-nums">{result.answer}</p>
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Enter the complete value shown here, including a minus sign or decimal point. A strike clears only the module’s entry screen; already passed stages remain passed.</SolverInstructions>
  </SolverLayout>;
}
