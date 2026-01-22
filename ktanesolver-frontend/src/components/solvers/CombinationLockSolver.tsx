import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveCombinationLock, type CombinationLockInput, type CombinationLockOutput } from "../../services/combinationLockService";
import { 
  useSolver,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  BombInfoDisplay,
  SolverControls
} from "../common";

interface CombinationLockSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function CombinationLockSolver({ bomb }: CombinationLockSolverProps) {
  const [result, setResult] = useState<CombinationLockOutput | null>(null);
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

  // Restore solution if module was solved
  useEffect(() => {
    if (currentModule?.solution && typeof currentModule.solution === 'object') {
      const solution = currentModule.solution as CombinationLockOutput;
      
      if (solution.instruction) {
        setResult(solution);
        setIsSolved(true);

        // Generate twitch command from the solution
        const command = generateTwitchCommand({
          moduleType: ModuleType.COMBINATION_LOCK,
          result: { 
            combination: [solution.firstNumber, solution.secondNumber, solution.thirdNumber],
            instruction: solution.instruction
          },
          moduleNumber
        });
        setTwitchCommand(command);
      }
    }
  }, [currentModule, moduleNumber, setIsSolved]);

  const solveCombinationLockModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const input: CombinationLockInput = {
      };
      
      const response = await solveCombinationLock(round.id, bomb.id, currentModule.id, {
        input
      });
      
      setResult(response.output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      
      const command = generateTwitchCommand({
        moduleType: ModuleType.COMBINATION_LOCK,
        result: { 
          combination: [response.output.firstNumber, response.output.secondNumber, response.output.thirdNumber],
          instruction: response.output.instruction
        },
        moduleNumber
      });
      setTwitchCommand(command);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve combination lock module");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
      {/* Combination Lock Module Configuration */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">COMBINATION LOCK MODULE</h3>
      </div>

      {/* Bomb info display */}
      <BombInfoDisplay bomb={bomb} />

      {/* Controls */}
      <SolverControls
        onSolve={solveCombinationLockModule}
        onReset={reset}
        isSolveDisabled={isSolved}
        isLoading={isLoading}
        solveText="Solve"
      />

      {/* Error display */}
      <ErrorAlert error={error} />

      {/* Results */}
      {result && (
        <div className={`alert mb-4 ${result.solved ? 'alert-success' : 'alert-info'}`}>
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
          <div className="w-full">
            <span className="font-bold">Combination Found!</span>
            <div className="mt-2 text-lg font-mono">
              {result.firstNumber} → {result.secondNumber} → {result.thirdNumber}
            </div>
            <div className="mt-2">{result.instruction}</div>
          </div>
        </div>
      )}

      {/* Twitch command display */}
      <TwitchCommandDisplay command={twitchCommand} />

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">The combination is calculated automatically from the bomb information.</p>
        <p>• The first number uses: (last digit of serial number + solved modules + batteries) mod 20</p>
        <p>• The second number uses: (total modules + solved modules) mod 20</p>
        <p>• The third number is the sum of the first two numbers mod 20</p>
        <p>• Turn the dial: RIGHT to first number, LEFT to second, RIGHT to third</p>
        <p>• If sequential numbers are the same, make a full revolution back to the same number</p>
      </div>
    </SolverLayout>
  );
}
