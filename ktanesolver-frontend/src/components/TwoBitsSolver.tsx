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
      setTwitchCommand(generateTwitchCommand(ModuleType.TWO_BITS, response.output));

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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Two Bits Solver</h2>
        <ModuleNumberInput moduleNumber={moduleNumber} />
      </div>

      {isSolved && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded">
          <p className="text-green-800 font-semibold">Module Solved!</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Stage: {currentStage} of 3
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStage / 3) * 100}%` }}
            />
          </div>
        </div>

        {currentStage === 1 ? (
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-800">
              Stage 1 uses calculated number from bomb properties (serial letter, batteries, ports).
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Number (0-99):
            </label>
            <input
              type="number"
              min="0"
              max="99"
              value={inputNumber}
              onChange={(e) => handleNumberChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter number from module"
              disabled={isLoading || isSolved}
            />
          </div>
        )}

        {result && (
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-semibold text-gray-800 mb-2">Solution:</h3>
            <p className="text-2xl font-mono text-center text-blue-600">
              {result.letters}
            </p>
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={solveTwoBitsModule}
            disabled={isLoading || isSolved || (currentStage > 1 && !inputNumber)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Solving..." : currentStage === 1 ? "Calculate Stage 1" : `Solve Stage ${currentStage}`}
          </button>
          
          {isSolved && (
            <button
              onClick={resetModule}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {twitchCommand && (
          <div className="mt-4 p-3 bg-purple-50 rounded">
            <p className="text-xs font-semibold text-purple-700 mb-1">Twitch Command:</p>
            <code className="text-xs text-purple-600 break-all">{twitchCommand}</code>
          </div>
        )}
      </div>
    </div>
  );
}
