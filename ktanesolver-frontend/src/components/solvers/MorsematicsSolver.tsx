import { useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveMorsematics as solveMorsematicsApi } from "../../services/morsematicsService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import ModuleNumberInput from "../ModuleNumberInput";

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
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

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
    setError("");

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
    if (isSolved) {
      reset();
    }
  };

  const reset = () => {
    setResult("");
    setIsSolved(false);
    setError("");
    setTwitchCommand("");
  };

  const fullReset = () => {
    setLetters("");
    reset();
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
    <div className="w-full">
      <ModuleNumberInput />
      
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
      <div className="bg-base-200 rounded p-3 mb-4">
        <p className="text-sm text-base-content/70">
          Serial Number: <span className="font-mono font-bold">{bomb?.serialNumber || "Unknown"}</span>
        </p>
        <p className="text-sm text-base-content/70">
          Batteries: <span className="font-mono font-bold">{(bomb?.aaBatteryCount ?? 0) + (bomb?.dBatteryCount ?? 0)}</span>
        </p>
        <p className="text-sm text-base-content/70">
          Strikes: <span className="font-mono font-bold">{bomb?.strikes ?? 0}</span>
        </p>
        <p className="text-sm text-base-content/70">
          Indicators: <span className="font-mono font-bold">{bomb?.indicators ? Object.entries(bomb.indicators).filter(([, value]) => value).map(([key]) => key).join(", ") || "None" : "None"}</span>
        </p>
        <p className="text-sm text-base-content/70">
          Ports: <span className="font-mono font-bold">{bomb?.portPlates?.flatMap(plate => plate.ports).join(", ") || "None"}</span>
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleSolve}
          className="btn btn-primary flex-1"
          disabled={letters.length !== 3 || isLoading}
        >
          {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
          {isLoading ? "Solving..." : "Solve"}
        </button>
        <button onClick={fullReset} className="btn btn-outline" disabled={isLoading}>
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

      {/* Twitch Command */}
      {twitchCommand && isSolved && (
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
        <p>Enter the 3 letters received from the Morse code lights.</p>
      </div>
    </div>
  );
}
