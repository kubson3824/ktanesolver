import { useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveWordScramble, type WordScrambleSolveRequest, type WordScrambleSolveResponse } from "../../services/wordScrambleService";
import ModuleNumberInput from "../ModuleNumberInput";

interface WordScrambleSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function WordScrambleSolver({ bomb }: WordScrambleSolverProps) {
  const [letters, setLetters] = useState<string>("");
  const [result, setResult] = useState<WordScrambleSolveResponse["output"] | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const handleLettersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
    if (value.length <= 6) {
      setLetters(value);
      setError("");
    }
  };

  const solveWordScrambleModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    if (letters.length !== 6) {
      setError("Please enter exactly 6 letters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const input: WordScrambleSolveRequest["input"] = {
        letters: letters
      };
      
      const response = await solveWordScramble(round.id, bomb.id, currentModule.id, {
        input
      });
      
      setResult(response.output);
      
      if (response.output.solved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        
        const command = generateTwitchCommand({
          moduleType: ModuleType.WORD_SCRAMBLE,
          result: { instruction: response.output.instruction },
          moduleNumber
        });
        setTwitchCommand(command);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve word scramble module");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setLetters("");
    setResult(null);
    setIsSolved(false);
    setError("");
    setTwitchCommand("");
  };

  return (
    <div className="w-full">
      <ModuleNumberInput />
      
      {/* Word Scramble Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">WORD SCRAMBLE MODULE</h3>
        
        {/* Letter Input */}
        <div className="bg-black rounded-lg p-6 mb-4">
          <div className="grid grid-cols-6 gap-2 max-w-md mx-auto">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className={`h-16 w-16 border-2 rounded-lg flex items-center justify-center text-2xl font-bold ${
                  letters[index]
                    ? 'bg-blue-600 border-blue-400 text-white'
                    : 'bg-gray-700 border-gray-600 text-gray-400'
                }`}
              >
                {letters[index] || ''}
              </div>
            ))}
          </div>
        </div>

        {/* Input Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Enter the 6 letters you see on the module:
          </label>
          <input
            type="text"
            value={letters}
            onChange={handleLettersChange}
            placeholder="Enter 6 letters"
            className="input input-bordered w-full max-w-md mx-auto block text-center text-xl tracking-widest"
            maxLength={6}
            disabled={isLoading || isSolved}
          />
          <div className="text-xs text-gray-500 mt-2 text-center">
            {letters.length}/6 letters
          </div>
        </div>
      </div>

      {/* Solve button */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={solveWordScrambleModule}
          className="btn btn-primary flex-1"
          disabled={isLoading || isSolved || letters.length !== 6}
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
              d={result.solved 
                ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              }
            />
          </svg>
          <div className="w-full">
            <span className="font-bold">{result.solved ? "Solution Found!" : "No Solution"}</span>
            <div className="mt-2">{result.instruction}</div>
            {result.solution && (
              <div className="mt-4">
                <div className="font-semibold mb-2">Solution Word:</div>
                <div className="text-2xl font-bold text-green-400 tracking-widest">
                  {result.solution}
                </div>
              </div>
            )}
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
        <p className="mb-2">Enter the 6 letters displayed on the Word Scramble module.</p>
        <p>• The solver will find all valid English words that can be formed</p>
        <p>• Only common 6-letter words are included in the word list</p>
        <p>• The first valid word found is displayed as the solution</p>
        <p>• Letters are automatically converted to uppercase</p>
      </div>
    </div>
  );
}
