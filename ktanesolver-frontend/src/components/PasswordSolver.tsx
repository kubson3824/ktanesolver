import { useState, useEffect } from "react";
import type { BombEntity } from "../types";
import { solvePassword, type PasswordOutput } from "../services/passwordService";
import { useRoundStore } from "../store/useRoundStore";
import { generateTwitchCommand } from "../utils/twitchCommands";
import ModuleNumberInput from "./ModuleNumberInput";

interface PasswordSolverProps {
  bomb: BombEntity | null | undefined;
}

// All possible password words from the enum
const PASSWORD_WORDS = [
  "ABOUT", "AFTER", "AGAIN", "BELOW", "COULD",
  "EVERY", "FIRST", "FOUND", "GREAT", "HOUSE",
  "LARGE", "LEARN", "NEVER", "OTHER", "PLACE",
  "PLANT", "POINT", "RIGHT", "SMALL", "SOUND",
  "SPELL", "STILL", "STUDY", "THEIR", "THERE",
  "THESE", "THING", "THINK", "THREE", "WATER",
  "WHERE", "WHICH", "WORLD", "WOULD", "WRITE"
];

export default function PasswordSolver({ bomb }: PasswordSolverProps) {
  const [columnLetters, setColumnLetters] = useState<Record<number, string>>({});
  const [result, setResult] = useState<PasswordOutput | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);


  const handleColumnChange = (column: number, value: string) => {
    // Filter to keep only uppercase letters and convert to array
    const letters = value.split('')
      .filter(letter => letter >= 'A' && letter <= 'Z');
    setColumnLetters(prev => ({
      ...prev,
      [column]: letters
    }));
  };

  const handleSolve = async () => {
    if (!round || !currentModule || !bomb) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const input = {
        letters: columnLetters
      };
      
      const response = await solvePassword(round.id, bomb.id, currentModule.id, { input });
      setResult(response.output);
      setIsSolved(response.output.resolved);
      
      if (response.output.resolved) {
        markModuleSolved(bomb.id, currentModule.id);
        
        if (response.output.possibleWords.length === 1) {
          const command = generateTwitchCommand({
            moduleType: currentModule.moduleType,
            result: { password: response.output.possibleWords[0] },
            moduleNumber: moduleNumber
          });
          setTwitchCommand(command);
        }
      }
    } catch (err) {
      setError("Failed to solve password module");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setColumnLetters({});
    setResult(null);
    setIsSolved(false);
    setError("");
    setTwitchCommand("");
  };


  return (
    <div className="flex flex-col gap-4 h-full">
      <ModuleNumberInput />
      {/* Password Module Display */}
      <div className="bg-base-200 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-center">Password Module</h3>
        
        {/* 5 Columns Input */}
        <div className="flex justify-center gap-3 mb-6">
          {[1, 2, 3, 4, 5].map(col => (
            <div key={col} className="flex flex-col items-center">
              <div className="text-xs text-center mb-1 font-bold">Column {col}</div>
              <input
                type="text"
                className="input input-bordered text-center font-bold text-lg w-20"
                placeholder="ABC"
                value={(columnLetters[col] || []).join('')}
                onChange={(e) => handleColumnChange(col, e.target.value.toUpperCase())}
              />
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="text-sm text-base-content/70 text-center mb-4">
          Enter the full name of the letters in each column (e.g., ABCDE)
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSolve}
            disabled={isLoading || Object.values(columnLetters).every(arr => arr.length === 0)}
          >
            {isLoading ? <span className="loading loading-spinner loading-xs"></span> : null}
            Solve
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
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

      {/* Results */}
      {result && (
        <div className="bg-base-100 p-4 rounded-lg flex-1 overflow-auto">
          <h4 className="font-semibold mb-3">
            Possible Words ({result.possibleWords.length})
          </h4>
          
          {result.resolved ? (
            <div className="alert alert-success mb-4">
              <span className="font-bold">Solution Found: {result.possibleWords[0]}</span>
            </div>
          ) : (
            <div className="alert alert-warning mb-4">
              <span>Multiple possibilities remain. Enter more letters to narrow down.</span>
            </div>
          )}

          {/* Possible Words List */}
          <div className="space-y-2">
            {result.possibleWords.map(word => (
              <div
                key={word}
                className={`
                  p-3 rounded text-center font-mono text-lg font-bold
                  ${result.resolved && result.possibleWords.length === 1
                    ? 'bg-success text-success-content'
                    : 'bg-warning text-warning-content'
                  }
                `}
              >
                {word}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
