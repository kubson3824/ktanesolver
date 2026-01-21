import { useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveAnagrams, type AnagramsSolveRequest, type AnagramsSolveResponse } from "../../services/anagramsService";
import ModuleNumberInput from "../ModuleNumberInput";

interface AnagramsSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function AnagramsSolver({ bomb }: AnagramsSolverProps) {
  const [displayWord, setDisplayWord] = useState<string>("");
  const [result, setResult] = useState<AnagramsSolveResponse["output"] | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const handleDisplayWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
    if (value.length <= 6) {
      setDisplayWord(value);
      setError("");
    }
  };

  const solveAnagramsModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    if (displayWord.length < 3) {
      setError("Please enter at least 3 letters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const input: AnagramsSolveRequest["input"] = {
        displayWord: displayWord.trim()
      };

      const response = await solveAnagrams(round.id, bomb.id, currentModule.id, {
        input
      });
      
      setResult(response.output);
      
      if (response.output.possibleSolutions.length > 0) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        
        const command = generateTwitchCommand({
          moduleType: ModuleType.ANAGRAMS,
          result: { possibleSolutions: response.output.possibleSolutions },
          moduleNumber
        });
        setTwitchCommand(command);
      }
    } catch (err) {
      setError((err as Error).message || "Failed to solve anagrams");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setDisplayWord("");
    setResult(null);
    setIsSolved(false);
    setError("");
    setTwitchCommand("");
  };

  return (
    <div className="w-full">
      <ModuleNumberInput />
      
      {/* Anagrams Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">ANAGRAMS MODULE</h3>
        
        {/* Letter Display */}
        <div className="bg-black rounded-lg p-6 mb-4">
          <div className="flex justify-center">
            <div className="flex gap-1">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className={`h-12 w-10 border-2 rounded flex items-center justify-center text-xl font-bold ${
                    displayWord[index]
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-400'
                  }`}
                >
                  {displayWord[index] || ''}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Input Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Enter the word displayed on the module:
          </label>
          <input
            type="text"
            value={displayWord}
            onChange={handleDisplayWordChange}
            placeholder="Enter the letters"
            className="input input-bordered w-full max-w-md mx-auto block text-center text-xl tracking-widest"
            maxLength={6}
            disabled={isLoading || isSolved}
          />
          <div className="text-xs text-gray-500 mt-2 text-center">
            {displayWord.length}/6 letters (minimum 3)
          </div>
        </div>
      </div>

      {/* Solve button */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={solveAnagramsModule}
          className="btn btn-primary flex-1"
          disabled={isLoading || isSolved || displayWord.length < 3}
        >
          {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
          {isLoading ? "Solving..." : "Find Anagrams"}
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
        <div className={`alert mb-4 ${result.possibleSolutions.length > 0 ? 'alert-success' : 'alert-info'}`}>
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
              d={result.possibleSolutions.length > 0
                ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              }
            />
          </svg>
          <div className="w-full">
            <span className="font-bold">{result.possibleSolutions.length > 0 ? "Possible Solutions:" : "No Solutions"}</span>
            <div className="mt-2">
              {result.possibleSolutions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.possibleSolutions.map((solution, index) => (
                    <span key={index} className="badge badge-lg badge-primary">
                      {solution}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm">No valid anagrams found</p>
              )}
            </div>
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
        <p className="mb-2">Enter the word displayed on the Anagrams module.</p>
        <p>• The solver will find all valid English words that can be formed</p>
        <p>• Common English words are included in the word list</p>
        <p>• Letters are automatically converted to uppercase</p>
        <p>• Minimum 3 letters required to find solutions</p>
      </div>
    </div>
  );
}
