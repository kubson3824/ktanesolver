import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveLetterKeys as solveLetterKeysApi } from "../../services/letterKeysService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { 
  useSolver,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  BombInfoDisplay,
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
    moduleNumber
  } = useSolver();

  // Restore state from module when component loads
  useEffect(() => {
    if (currentModule?.state && typeof currentModule.state === 'object') {
      const moduleState = currentModule.state as { number?: string };
      
      if (moduleState.number) {
        setNumber(moduleState.number);
      }
    }

    // Restore solution if module was solved
    if (currentModule?.solution && typeof currentModule.solution === 'object') {
      const solution = currentModule.solution as { letter?: string };
      
      if (solution.letter) {
        setResult(`Press button ${solution.letter}`);
        setIsSolved(true);

        // Generate twitch command from the solution
        const command = generateTwitchCommand({
          moduleType: ModuleType.LETTER_KEYS,
          result: { letter: solution.letter },
          moduleNumber
        });
        setTwitchCommand(command);
      }
    }
  }, [currentModule, moduleNumber, setIsSolved]);

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
      if (error) clearError();
      
      // Save state to module
      if (currentModule) {
        const moduleState = { number: value };
        useRoundStore.getState().round?.bombs.forEach(bomb => {
          if (bomb.id === currentModule.bomb.id) {
            const module = bomb.modules.find(m => m.id === currentModule.id);
            if (module) {
              module.state = moduleState;
            }
          }
        });
      }
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


      {/* Bomb info display */}
      <BombInfoDisplay bomb={bomb} />

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
