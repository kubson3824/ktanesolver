import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveWordScramble, type WordScrambleSolveRequest, type WordScrambleSolveResponse } from "../../services/wordScrambleService";
import SolverLayout from "../common/SolverLayout";
import BombInfoDisplay from "../common/BombInfoDisplay";
import SolverControls from "../common/SolverControls";
import ErrorAlert from "../common/ErrorAlert";
import TwitchCommandDisplay from "../common/TwitchCommandDisplay";
import { useSolver } from "../../hooks/useSolver";

interface WordScrambleSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function WordScrambleSolver({ bomb }: WordScrambleSolverProps) {
  const [letters, setLetters] = useState<string>("");
  const [result, setResult] = useState<WordScrambleSolveResponse["output"] | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const { isLoading, error, isSolved, clearError, resetSolverState } = useSolver();

  const handleLettersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
    if (value.length <= 6) {
      setLetters(value);
      clearError();
    }
  };

  const solveWordScrambleModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      clearError();
      return;
    }

    if (letters.length !== 6) {
      clearError();
      return;
    }

    clearError();

    try {
      const input: WordScrambleSolveRequest["input"] = {
        letters: letters
      };
      
      const response = await solveWordScramble(round.id, bomb.id, currentModule.id, {
        input
      });
      
      setResult(response.output);
      
      if (response.output.solved) {
        markModuleSolved(bomb.id, currentModule.id);
        
        const command = generateTwitchCommand({
          moduleType: ModuleType.WORD_SCRAMBLE,
          result: { instruction: response.output.instruction },
          moduleNumber
        });
        setTwitchCommand(command);
        
        // Save solution to currentModule
        if (currentModule) {
          currentModule.solution = response.output;
        }
      }
    } catch (err) {
      console.error(err instanceof Error ? err.message : "Failed to solve word scramble module");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setLetters("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  // Save state to currentModule
  const saveState = () => {
    if (currentModule) {
      currentModule.state = {
        letters,
        result,
        twitchCommand
      };
    }
  };

  // Restore state from currentModule
  useEffect(() => {
    if (currentModule?.state) {
      const state = currentModule.state as {
        letters?: string;
        result?: WordScrambleSolveResponse["output"];
        twitchCommand?: string;
      };
      
      if (state.letters !== undefined) setLetters(state.letters);
      if (state.result) setResult(state.result);
      if (state.twitchCommand) setTwitchCommand(state.twitchCommand);
    }
  }, [currentModule]);

  // Save state whenever it changes
  useEffect(() => {
    saveState();
  }, [letters, result, twitchCommand]);

  return (
    <SolverLayout>
      <BombInfoDisplay bomb={bomb} />
      
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

      <SolverControls
        onSolve={solveWordScrambleModule}
        onReset={reset}
        isSolved={isSolved}
        isLoading={isLoading}
        solveButtonText="Solve"
      />

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

      {twitchCommand && result && (
        <TwitchCommandDisplay command={twitchCommand} />
      )}

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Enter the 6 letters displayed on the Word Scramble module.</p>
        <p>• The solver will find all valid English words that can be formed</p>
        <p>• Only common 6-letter words are included in the word list</p>
        <p>• The first valid word found is displayed as the solution</p>
        <p>• Letters are automatically converted to uppercase</p>
      </div>
    </SolverLayout>
  );
}
