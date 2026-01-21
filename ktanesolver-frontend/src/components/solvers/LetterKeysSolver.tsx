import { useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveLetterKeys as solveLetterKeysApi } from "../../services/letterKeysService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import ModuleNumberInput from "../ModuleNumberInput";

interface LetterKeysSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function LetterKeysSolver({ bomb }: LetterKeysSolverProps) {
  const [number, setNumber] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const handleSolve = async () => {
    const numValue = parseInt(number);
    
    if (!number || isNaN(numValue) || numValue < 0 || numValue > 99) {
      setError("Please enter a valid two-digit number (00-99)");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await solveLetterKeysApi(round.id, bomb.id, currentModule.id, {
        input: {
          number: numValue
        }
      });

      const letter = response.output.letter;
      setResult(`Press button ${letter}`);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      // Generate Twitch command
      const command = generateTwitchCommand({
        moduleType: ModuleType.LETTER_KEYS,
        result: { letter },
        moduleNumber
      });
      setTwitchCommand(command);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Letter Keys");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumberChange = (value: string) => {
    // Only allow numbers and limit to 2 digits
    if (value === "" || (/^\d{0,2}$/.test(value))) {
      setNumber(value);
      if (error) setError("");
    }
  };

  const reset = () => {
    setNumber("");
    setResult("");
    setIsSolved(false);
    setError("");
    setTwitchCommand("");
  };

  return (
    <div className="w-full">
      <ModuleNumberInput />
      
      {/* Module visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <div className="flex justify-center mb-6">
          <div className="bg-gray-900 rounded-lg p-4">
            <input
              type="text"
              value={number}
              onChange={(e) => handleNumberChange(e.target.value)}
              placeholder="00"
              className="text-4xl font-mono font-bold text-green-400 bg-transparent text-center min-w-[120px] outline-none"
              maxLength={2}
              disabled={isLoading || isSolved}
            />
          </div>
        </div>
        
        {/* Four buttons visualization */}
        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
          {['A', 'B', 'C', 'D'].map((letter) => (
            <div
              key={letter}
              className={`h-16 rounded-lg flex items-center justify-center text-xl font-bold transition-all ${
                result.includes(letter)
                  ? 'bg-green-500 text-white ring-4 ring-green-400 ring-opacity-75'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {letter}
            </div>
          ))}
        </div>
      </div>

      {/* Serial number and batteries display */}
      <div className="bg-base-200 rounded p-3 mb-4">
        <p className="text-sm text-base-content/70">
          Serial Number: <span className="font-mono font-bold">{bomb?.serialNumber || "Unknown"}</span>
        </p>
        <p className="text-sm text-base-content/70">
          Batteries: <span className="font-mono font-bold">{(bomb?.aaBatteryCount ?? 0) + (bomb?.dBatteryCount ?? 0)}</span>
        </p>
        <p className="text-sm text-base-content/70">
          Indicators: <span className="font-mono font-bold">{bomb?.indicators ? Object.entries(bomb.indicators).filter(([, value]) => value).map(([key]) => key).join(", ") || "None" : "None"}</span>
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleSolve}
          className="btn btn-primary flex-1"
          disabled={!number || isLoading || isSolved}
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

      {/* Result */}
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
          <span className="font-bold">{result}</span>
        </div>
      )}

      {/* Twitch Command */}
      {twitchCommand && (
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
        <p>Click on the display to enter the two-digit number shown on the module. The solver will tell you which button to press (A, B, C, or D).</p>
      </div>
    </div>
  );
}
