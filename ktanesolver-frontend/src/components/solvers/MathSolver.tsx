import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveMath, type MathOutput, type MathInput } from "../../services/mathService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverResult,
} from "../common";
import { Input } from "../ui/input";

interface MathSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function MathSolver({ bomb }: MathSolverProps) {
  const [equation, setEquation] = useState<string>("");
  const [result, setResult] = useState<MathOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const {
    isLoading,
    error,
    isSolved,
    setIsLoading,
    setError,
    setIsSolved,
    clearError,
    reset: resetSolverState,
    currentModule,
    round,
    markModuleSolved,
  } = useSolver();

  const moduleState = useMemo(
    () => ({ equation, result, twitchCommand }),
    [equation, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      equation?: string;
      input?: { equation?: string };
      result?: MathOutput | null;
      twitchCommand?: string;
    }) => {
      const equationToRestore =
        state.equation ??
        (state.input && typeof state.input.equation === "string" ? state.input.equation : undefined);
      if (equationToRestore !== undefined) setEquation(equationToRestore);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: MathOutput) => {
    if (solution && typeof solution.result === "number") {
      setResult(solution);
      const command = generateTwitchCommand({
        moduleType: ModuleType.MATH,
        result: { answer: String(solution.result) },
      });
      setTwitchCommand(command);
    }
  }, []);

  useSolverModulePersistence<
    { equation: string; result: MathOutput | null; twitchCommand: string },
    MathOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      const asMathOutput = (obj: unknown): MathOutput | null => {
        if (obj && typeof obj === "object" && typeof (obj as MathOutput).result === "number") {
          return obj as MathOutput;
        }
        return null;
      };
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; result?: unknown; solution?: unknown };
        return (
          asMathOutput(anyRaw.output) ??
          asMathOutput(anyRaw.result) ??
          asMathOutput(anyRaw.solution) ??
          asMathOutput(raw)
        );
      }
      return null;
    },
    inferSolved: (_solution, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleEquationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^-?\d*([+\-*/]?\d*)?$/.test(value)) {
      setEquation(value);
      clearError();
    }
  };

  const solveMathModule = async () => {
    if (!equation.trim()) {
      setError("Please enter an equation");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const input: MathInput = {
        equation: equation.trim(),
      };

      const response = await solveMath(round.id, bomb.id, currentModule.id, { input });

      setResult(response.output);

      if (response.output && typeof response.output.result === "number") {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        const command = generateTwitchCommand({
          moduleType: ModuleType.MATH,
          result: { answer: String(response.output.result) },
        });
        setTwitchCommand(command);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve equation");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setEquation("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading && !isSolved) {
      void solveMathModule();
    }
  };

  return (
    <SolverLayout>
      <SolverSection
        title="Equation"
        description="Enter the math expression shown on the module."
      >
        <Input
          type="text"
          value={equation}
          onChange={handleEquationChange}
          onKeyPress={handleKeyPress}
          placeholder="e.g. 52+123"
          className="text-center font-mono text-2xl"
          disabled={isLoading || isSolved}
          aria-label="Math equation"
        />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Supports <span className="font-mono">+ - * /</span>
        </p>
      </SolverSection>

      <SolverControls
        onSolve={solveMathModule}
        onReset={reset}
        isSolveDisabled={!equation.trim()}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Press OK"
      />

      <ErrorAlert error={error} />

      {result != null && typeof result.result === "number" && (
        <SolverResult variant="success" title="Answer" description={`Result: ${result.result}`} />
      )}

      {twitchCommand && result != null && typeof result.result === "number" && (
        <TwitchCommandDisplay command={twitchCommand} />
      )}

      <SolverInstructions>
        Type the full expression, then press OK. Press Enter to solve from the keyboard.
      </SolverInstructions>
    </SolverLayout>
  );
}
