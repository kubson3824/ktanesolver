import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveMorsematics as solveMorsematicsApi } from "../../services/morsematicsService";
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

interface MorsematicsSolverProps {
  bomb: BombEntity | null | undefined;
}

const MORSE_CODE: Record<string, string> = {
  'A': '.-',
  'B': '-...',
  'C': '-.-.',
  'D': '-..',
  'E': '.',
  'F': '..-.',
  'G': '--.',
  'H': '....',
  'I': '..',
  'J': '.---',
  'K': '-.-',
  'L': '.-..',
  'M': '--',
  'N': '-.',
  'O': '---',
  'P': '.--.',
  'Q': '--.-',
  'R': '.-.',
  'S': '...',
  'T': '-',
  'U': '..-',
  'V': '...-',
  'W': '.--',
  'X': '-..-',
  'Y': '-.--',
  'Z': '--..',
};

export default function MorsematicsSolver({ bomb }: MorsematicsSolverProps) {
  const [letters, setLetters] = useState<string>("");
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
      const moduleState = currentModule.state as { letters?: string };
      
      if (moduleState.letters !== undefined) setLetters(moduleState.letters);
    }

    // Restore solution if module was solved
    if (currentModule?.solution && typeof currentModule.solution === 'object') {
      const solution = currentModule.solution as { letter: string };
      
      if (solution.letter) {
        setResult(solution.letter);
        setIsSolved(true);

        // Generate twitch command from the solution
        const command = generateTwitchCommand({
          moduleType: ModuleType.MORSEMATICS,
          result: solution,
          moduleNumber
        });
        setTwitchCommand(command);
      }
    }
  }, [currentModule, moduleNumber, setIsSolved]);

  // Save state when inputs change
  const saveState = (value: string) => {
    if (currentModule) {
      const moduleState = { letters: value };
      // Update the module in the store
      const { round } = useRoundStore.getState();
      round?.bombs.forEach(bomb => {
        if (bomb.id === currentModule.bomb.id) {
          const module = bomb.modules.find(m => m.id === currentModule.id);
          if (module) {
            module.state = moduleState;
          }
        }
      });
    }
  };

  const handleSolve = async () => {
    if (!letters || letters.length !== 3) {
      setError("Please enter exactly 3 letters");
      return;
    }

    if (!/^[a-zA-Z]{3}$/.test(letters)) {
      setError("Please enter only letters (A-Z)");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveMorsematicsApi(round.id, bomb.id, currentModule.id, {
        input: {
          letters: letters.toUpperCase()
        }
      });

      setResult(response.output.letter);

      // Generate Twitch command
      const command = generateTwitchCommand({
        moduleType: ModuleType.MORSEMATICS,
        result: response.output,
        moduleNumber
      });
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve morsematics");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLetterChange = (value: string) => {
    const filtered = value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3);
    setLetters(filtered);
    saveState(filtered);
    if (isSolved) {
      reset();
    }
  };

  const reset = () => {
    setResult("");
    setTwitchCommand("");
  };

  const fullReset = () => {
    setLetters("");
    saveState("");
    reset();
    resetSolverState();
  };

  const displayMorseCode = (text: string) => {
    return text.split('').map((char, index) => (
      <div key={index} className="flex flex-col items-center">
        <span className="text-2xl font-bold text-gray-300">{char}</span>
        <div className="flex gap-1 mt-1">
          {MORSE_CODE[char]?.split('').map((symbol, symbolIndex) => (
            <span key={symbolIndex} className="text-lg text-gray-400">
              {symbol === '.' ? '•' : '—'}
            </span>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <SolverLayout>
      {/* Input section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Received Letters (3 letters):
        </label>
        <input
          type="text"
          value={letters}
          onChange={(e) => handleLetterChange(e.target.value)}
          className="input input-bordered w-full text-center text-2xl font-mono uppercase tracking-widest"
          placeholder="ABC"
          maxLength={3}
          disabled={isLoading}
        />
        
        {/* Morse code display for input */}
        {letters.length > 0 && (
          <div className="mt-4 flex justify-center gap-4">
            {displayMorseCode(letters)}
          </div>
        )}
      </div>

      {/* Bomb info display */}
      <BombInfoDisplay bomb={bomb} />

      {/* Controls */}
      <SolverControls
        onSolve={handleSolve}
        onReset={fullReset}
        isSolveDisabled={letters.length !== 3}
        isLoading={isLoading}
        solveText="Solve"
      />

      {/* Error display */}
      <ErrorAlert error={error} />

      {/* Result */}
      {result && isSolved && (
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
          <div>
            <span className="font-bold mb-2 block">Transmit Letter:</span>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-mono font-bold">{result}</span>
              <div className="flex gap-1">
                {MORSE_CODE[result]?.split('').map((symbol, index) => (
                  <span key={index} className="text-2xl">
                    {symbol === '.' ? '•' : '—'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Twitch command display */}
      <TwitchCommandDisplay command={twitchCommand} />

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p>Enter the 3 letters received from the Morse code lights.</p>
      </div>
    </SolverLayout>
  );
}
