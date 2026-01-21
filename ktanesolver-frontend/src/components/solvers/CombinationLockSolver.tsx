import { useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveCombinationLock, type CombinationLockInput, type CombinationLockOutput } from "../../services/combinationLockService";
import ModuleNumberInput from "../ModuleNumberInput";

interface CombinationLockSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function CombinationLockSolver({ bomb }: CombinationLockSolverProps) {
  const [result, setResult] = useState<CombinationLockOutput | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const solveCombinationLockModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    setError("");

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
    setIsSolved(false);
    setError("");
    setTwitchCommand("");
  };

  return (
    <div className="w-full">
      <ModuleNumberInput />
      
      {/* Combination Lock Module Configuration */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">COMBINATION LOCK MODULE</h3>
        
        {/* Bomb Info Display */}
        {bomb && (
          <div className="text-xs text-gray-500 mb-4">
            <div>Serial Number: {bomb.serialNumber || "N/A"}</div>
            <div>Batteries: {bomb.aaBatteryCount + bomb.dBatteryCount}</div>
            <div>Total Modules: {bomb.modules?.length || 0}</div>
            <div>Solved Modules: {bomb.modules?.filter(m => m.solved).length || 0}</div>
          </div>
        )}
      </div>

      {/* Solve button */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={solveCombinationLockModule}
          className="btn btn-primary flex-1"
          disabled={isLoading || isSolved}
        >
          {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
          {isLoading ? "Solving..." : "Solve"}
        </button>
        <button onClick={reset} className="btn btn-outline" disabled={isLoading}>
          Reset
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error mb-4">
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
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

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

      {/* Twitch Command */}
      {twitchCommand && result && (
        <div className="bg-purple-900/20 border border-purple-500 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-purple-400 mb-1">Twitch Chat Command:</h4>
              <code className="text-lg font-mono text-purple-200">{twitchCommand}</code>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(twitchCommand);
              }}
              className="btn btn-sm btn-outline btn-purple"
              title="Copy to clipboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">The combination is calculated automatically from the bomb information.</p>
        <p>• The first number uses: (last digit of serial number + solved modules + batteries) mod 20</p>
        <p>• The second number uses: (total modules + solved modules) mod 20</p>
        <p>• The third number is the sum of the first two numbers mod 20</p>
        <p>• Turn the dial: RIGHT to first number, LEFT to second, RIGHT to third</p>
        <p>• If sequential numbers are the same, make a full revolution back to the same number</p>
      </div>
    </div>
  );
}
