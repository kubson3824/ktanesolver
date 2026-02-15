import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveLetterKeys as solveLetterKeysApi } from "../../services/letterKeysService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { 
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls
} from "../common";

interface LetterKeysSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function LetterKeysSolver({ bomb }: LetterKeysSolverProps) {
  const [number, setNumber] = useState<string>("");
  const [result, setResult] = useState<string>("");
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
  } = useSolver();

  const moduleState = useMemo(
    () => ({ number, result, twitchCommand }),
    [number, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: { number?: string; input?: { number?: number }; result?: string; twitchCommand?: string }) => {
      const restoredNumber = state.number ?? (state.input?.number !== undefined ? String(state.input.number) : undefined);
      if (restoredNumber !== undefined) setNumber(restoredNumber);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: { letter: string }) => {
      if (!solution?.letter) return;
      setResult(`Press button ${solution.letter}`);

      const command = generateTwitchCommand({
        moduleType: ModuleType.LETTER_KEYS,
        result: { letter: solution.letter },
      });
      setTwitchCommand(command);
    },
  []);

  useSolverModulePersistence<{ number: string; result: string; twitchCommand: string }, { letter: string }>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; letter?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as { letter: string };
        if (typeof anyRaw.letter === "string") return { letter: anyRaw.letter };
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

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
    clearError();

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
      if (error) clearError();
    }
  };

  const reset = () => {
    setNumber("");
    setResult("");
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
      
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


      {/* Controls */}
      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!number}
        isLoading={isLoading}
        solveText="Solve"
      />

      {/* Error display */}
      <ErrorAlert error={error} />

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

      {/* Twitch command display */}
      <TwitchCommandDisplay command={twitchCommand} />
    </SolverLayout>
  );
}
