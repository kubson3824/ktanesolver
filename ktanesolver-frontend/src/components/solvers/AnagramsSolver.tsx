import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveAnagrams, type AnagramsSolveRequest, type AnagramsSolveResponse } from "../../services/anagramsService";
import { 
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay
} from "../common";

interface AnagramsSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function AnagramsSolver({ bomb }: AnagramsSolverProps) {
  const [displayWord, setDisplayWord] = useState<string>("");
  const [result, setResult] = useState<AnagramsSolveResponse["output"] | null>(null);
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
    () => ({ displayWord, result, twitchCommand }),
    [displayWord, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: { displayWord?: string; result?: AnagramsSolveResponse["output"] | null; twitchCommand?: string } | { input?: {displayWord?: string}}) => {
      // Handle both formats: with or without input wrapper (backend uses input.displayWord)
      if ('input' in state && state.input?.displayWord) {
        setDisplayWord(state.input.displayWord);
      } else if ('displayWord' in state && state.displayWord !== undefined) {
        setDisplayWord(state.displayWord);
      }

      if ('result' in state && state.result !== undefined) {
        setResult(state.result);
      }
      if ('twitchCommand' in state && state.twitchCommand !== undefined) {
        setTwitchCommand(state.twitchCommand);
      }
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: AnagramsSolveResponse["output"]) => {
      if (!solution || !solution.possibleSolutions) return;
      setResult(solution);

      if (solution.possibleSolutions.length > 0) {
        const command = generateTwitchCommand({
          moduleType: ModuleType.ANAGRAMS,
          result: { possibleSolutions: solution.possibleSolutions },
        });
        setTwitchCommand(command);
      }
    },
  []);

  useSolverModulePersistence<
    { displayWord: string; result: AnagramsSolveResponse["output"] | null; twitchCommand: string },
    AnagramsSolveResponse["output"]
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; result?: unknown };
        if ('result' in anyRaw) {
          return anyRaw.result as AnagramsSolveResponse["output"];
        }
        if (anyRaw.output && typeof anyRaw.output === "object") {
          return anyRaw.output as AnagramsSolveResponse["output"];
        }
        return raw as AnagramsSolveResponse["output"];
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleDisplayWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
    if (value.length <= 6) {
      setDisplayWord(value);
      if (error) clearError();
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

    clearError();
    setIsLoading(true);

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
          result: response.output,
        });
        setTwitchCommand(command);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve anagrams");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setDisplayWord("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
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

      {/* Controls */}
      <SolverControls
        onSolve={solveAnagramsModule}
        onReset={reset}
        isSolveDisabled={displayWord.length < 3}
        isLoading={isLoading}
        solveText="Find Anagrams"
      />

      {/* Error display */}
      <ErrorAlert error={error} />

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

      {/* Twitch command display */}
      <TwitchCommandDisplay command={twitchCommand} />

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Enter the word displayed on the Anagrams module.</p>
        <p>• The solver will find all valid English words that can be formed</p>
        <p>• Common English words are included in the word list</p>
        <p>• Letters are automatically converted to uppercase</p>
        <p>• Minimum 3 letters required to find solutions</p>
      </div>
    </SolverLayout>
  );
}
