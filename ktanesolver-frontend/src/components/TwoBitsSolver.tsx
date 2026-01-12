import { useState } from "react";
import type { BombEntity } from "../types";
import { ModuleType } from "../types";
import { useRoundStore } from "../store/useRoundStore";
import { generateTwitchCommand } from "../utils/twitchCommands";
import { solveTwoBits, type TwoBitsInput, type TwoBitsOutput } from "../services/twoBitsService";
import ModuleNumberInput from "./ModuleNumberInput";

interface TwoBitsSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function TwoBitsSolver({ bomb }: TwoBitsSolverProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [inputNumber, setInputNumber] = useState("");
  const [result, setResult] = useState<TwoBitsOutput | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const solveTwoBitsModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const input: TwoBitsInput = {
        stage: currentStage,
        number: currentStage === 1 ? 0 : parseInt(inputNumber) || 0,
      };

      const response = await solveTwoBits(round.id, bomb.id, currentModule.id, { input });
      
      setResult(response.output);
      const command = generateTwitchCommand({
        moduleType: ModuleType.TWO_BITS,
        result: response.output,
        moduleNumber
      });
      setTwitchCommand(command);

      if (currentStage === 3) {
        setIsSolved(true);
        markModuleSolved();
      } else {
        setCurrentStage(currentStage + 1);
        setInputNumber("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve module");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumberChange = (value: string) => {
    const num = parseInt(value);
    if (value === "" || (num >= 0 && num <= 99)) {
      setInputNumber(value);
      setError("");
    }
  };

  const resetModule = () => {
    setCurrentStage(1);
    setInputNumber("");
    setResult(null);
    setIsSolved(false);
    setError("");
    setTwitchCommand("");
  };

  return (
    <div className="w-full">
      <ModuleNumberInput />
      
      {/* Two Bits Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">TWO BITS MODULE</h3>
        
        {/* Stage Display */}
        <div className="bg-black rounded-lg p-6 mb-4">
          <div className="text-center">
            <p className="text-blue-400 text-sm font-medium mb-2">STAGE</p>
            <p className="text-4xl font-bold text-white">{currentStage}/3</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(currentStage / 3) * 100}%` }}
            />
          </div>
        </div>

        {currentStage === 1 ? (
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-300 text-center">
              Stage 1 uses calculated number from bomb properties (serial letter, batteries, ports).
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Enter Number (0-99):
            </label>
            <input
              type="number"
              min="0"
              max="99"
              value={inputNumber}
              onChange={(e) => handleNumberChange(e.target.value)}
              className="input input-bordered w-full max-w-md mx-auto block text-center text-2xl tracking-widest"
              placeholder="00"
              disabled={isLoading || isSolved}
            />
          </div>
        )}
      </div>

      {/* Solve button */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={solveTwoBitsModule}
          className="btn btn-primary flex-1"
          disabled={isLoading || isSolved || (currentStage > 1 && !inputNumber)}
        >
          {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
          {isLoading ? "Solving..." : currentStage === 1 ? "Calculate Stage 1" : `Solve Stage ${currentStage}`}
        </button>
        
        {isSolved && (
          <button onClick={resetModule} className="btn btn-outline" disabled={isLoading}>
            Reset
          </button>
        )}
      </div>

      {/* Success Message */}
      {isSolved && (
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
          <span>Module Solved!</span>
        </div>
      )}

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
        <div className="bg-gray-800 rounded-lg p-6 mb-4">
          <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">SOLUTION</h3>
          <div className="bg-black rounded-lg p-6">
            <p className="text-4xl font-mono text-center text-blue-400">
              {result.letters}
            </p>
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
        <p className="mb-2">Enter the number displayed on the Two Bits module for each stage.</p>
        <p>• Stage 1 is calculated automatically from bomb properties</p>
        <p>• For stages 2 and 3, enter the number shown on the module</p>
        <p>• The solver will provide the corresponding letter sequence</p>
      </div>
    </div>
  );
}
