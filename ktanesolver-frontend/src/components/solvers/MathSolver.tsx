import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveMath, type MathOutput, type MathInput } from "../../services/mathService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { 
  useSolver,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  BombInfoDisplay,
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
    moduleNumber
  } = useSolver();

  // Save state to module when inputs change
  const saveState = () => {
    if (currentModule) {
      const moduleState = {
        equation,
        result,
        twitchCommand
      };
      // Update the module in the store
      useRoundStore.getState().round?.bombs.forEach(bomb => {
        if (bomb.id === currentModule.bomb.id) {
          const module = bomb.modules.find(m => m.id === currentModule.id);
          if (module) {
            module.state = moduleState;
          }
        }
      });
    }
  };

  // Update state when inputs change
  useEffect(() => {
    saveState();
  }, [equation, result, twitchCommand]);

  // Restore state from module when component loads
  useEffect(() => {
    if (currentModule?.state && typeof currentModule.state === 'object') {
      const moduleState = currentModule.state as { 
        equation?: string;
        result?: MathOutput | null;
        twitchCommand?: string;
      };
      
      if (moduleState.equation !== undefined) setEquation(moduleState.equation);
      if (moduleState.result !== undefined) setResult(moduleState.result);
      if (moduleState.twitchCommand) setTwitchCommand(moduleState.twitchCommand);
    }

    // Restore solution if module was solved
    if (currentModule?.solution && typeof currentModule.solution === 'object') {
      const solution = currentModule.solution as { 
        result?: MathOutput;
        isSolved?: boolean;
      };
      
      if (solution.result) {
        setResult(solution.result);
      }
      if (solution.isSolved) {
        setIsSolved(true);
      }
    }
  }, [currentModule, moduleNumber, setIsSolved]);

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
      
      if (response.output) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        
        const command = generateTwitchCommand({
          moduleType: ModuleType.MATH,
          result: { answer: response.output.result.toString() },
          moduleNumber
        });
        setTwitchCommand(command);
        
        // Save solution
        if (currentModule) {
          useRoundStore.getState().round?.bombs.forEach(bomb => {
            if (bomb.id === currentModule.bomb.id) {
              const module = bomb.modules.find(m => m.id === currentModule.id);
              if (module) {
                module.solution = { result: response.output };
              }
            }
          });
        }
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

      {/* Bomb info display */}
      <BombInfoDisplay bomb={bomb} />
      
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
      {result && (
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
      {twitchCommand && result && (
        <TwitchCommandDisplay command={twitchCommand} />
      )}

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Enter the mathematical equation shown on the module.</p>
        <p>• Use the format: number [+,-,*,/] number</p>
        <p>• Press Enter or click "Press OK" to calculate</p>
      </div>
    </div>
  );
}
