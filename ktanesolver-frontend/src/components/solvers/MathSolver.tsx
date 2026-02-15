import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveMath, type MathOutput, type MathInput } from "../../services/mathService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { 
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls
} from "../common";

interface MathSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function MathSolver({ bomb }: MathSolverProps) {
  const [equation, setEquation] = useState<string>("");
  const [result, setResult] = useState<MathOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  // Use the common solver hook for shared state
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
    (state: { equation?: string; input?: { equation?: string }; result?: MathOutput | null; twitchCommand?: string }) => {
      const equationToRestore = state.equation ?? (state.input && typeof state.input.equation === "string" ? state.input.equation : undefined);
      if (equationToRestore !== undefined) setEquation(equationToRestore);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: MathOutput) => {
      if (solution && typeof solution.result === "number") {
        setResult(solution);
        const command = generateTwitchCommand({
          moduleType: ModuleType.MATH,
          result: { answer: String(solution.result) },
        });
        setTwitchCommand(command);
      }
    },
  []);

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
        return asMathOutput(anyRaw.output) ?? asMathOutput(anyRaw.result) ?? asMathOutput(anyRaw.solution) ?? asMathOutput(raw);
      }
      return null;
    },
    inferSolved: (_solution, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleEquationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow digits, operators, and minus sign
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
        equation: equation.trim()
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
    if (e.key === 'Enter' && !isLoading && !isSolved) {
      solveMathModule();
    }
  };

  return (
    <SolverLayout>
      {/* Math Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">MATH MODULE</h3>
        
        {/* Display area */}
        <div className="bg-black rounded-lg p-4 mb-4 min-h-[120px] flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Enter Equation</div>
            <input
              type="text"
              value={equation}
              onChange={handleEquationChange}
              onKeyPress={handleKeyPress}
              placeholder="e.g., 52+123"
              className="input input-bordered input-lg font-mono text-center text-2xl w-full max-w-xs bg-gray-900 text-gray-100 border-gray-700 focus:border-primary"
              disabled={isLoading || isSolved}
            />
            <div className="text-xs text-gray-500 mt-2">
              Supports: +, -, *, / (e.g., 52+123, 99-12, 23*12)
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <SolverControls
        onSolve={solveMathModule}
        onReset={reset}
        isSolveDisabled={!equation.trim()}
        isLoading={isLoading}
        solveText="Press OK"
      />

      {/* Error display */}
      <ErrorAlert error={error} />

      {/* Results */}
      {result != null && typeof result.result === "number" && (
        <div className="alert alert-success mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <span className="font-bold">Result:</span>
            <div className="mt-2 font-mono text-2xl">{result.result}</div>
          </div>
        </div>
      )}

      {/* Twitch command display */}
      {twitchCommand && result != null && typeof result.result === "number" && (
        <TwitchCommandDisplay command={twitchCommand} />
      )}

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Enter the mathematical equation shown on the module.</p>
        <p>• Use the format: number [+,-,*,/] number</p>
        <p>• Press Enter or click "Press OK" to calculate</p>
      </div>
    </SolverLayout>
  );
}
