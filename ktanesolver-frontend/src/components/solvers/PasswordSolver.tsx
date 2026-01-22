import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solvePassword, type PasswordOutput } from "../../services/passwordService";
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

interface PasswordSolverProps {
  bomb: BombEntity | null | undefined;
}

// All possible password words from the enum
export default function PasswordSolver({ bomb }: PasswordSolverProps) {
  const [columnLetters, setColumnLetters] = useState<Record<number, string[]>>({});
  const [result, setResult] = useState<PasswordOutput | null>(null);
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


  // Save state to module when inputs change
  const saveState = () => {
    if (currentModule) {
      const moduleState = {
        columnLetters,
        result,
        twitchCommand
      };
      // Update the module in the store
      useRoundStore.getState().round?.bombs.forEach(bomb => {
        if (bomb.id === currentModule.bomb.id) {
          const module = bomb.modules.find(m => m.id === currentModule.id);
          if (module) {
            module.state = moduleState;
          }
        }
      });
    }
  };

  // Update state when inputs change
  useEffect(() => {
    saveState();
  }, [columnLetters, result, twitchCommand]);

  // Restore state from module when component loads
  useEffect(() => {
    if (currentModule?.state && typeof currentModule.state === 'object') {
      const moduleState = currentModule.state as { 
        columnLetters?: Record<number, string[]>;
        result?: PasswordOutput | null;
        twitchCommand?: string;
      };
      
      if (moduleState.columnLetters) setColumnLetters(moduleState.columnLetters);
      if (moduleState.result !== undefined) setResult(moduleState.result);
      if (moduleState.twitchCommand !== undefined) setTwitchCommand(moduleState.twitchCommand);
    }

    // Restore solution if module was solved
    if (currentModule?.solution && typeof currentModule.solution === 'object') {
      const solution = currentModule.solution as { 
        result?: PasswordOutput;
        isSolved?: boolean;
      };
      
      if (solution.result) {
        setResult(solution.result);
        if (solution.isSolved || solution.result.resolved) {
          setIsSolved(true);
        }
      }
    }
  }, [currentModule, moduleNumber, setIsSolved]);

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
    clearError();
    
    try {
      const input = {
        letters: columnLetters
      };
      
      const response = await solvePassword(round.id, bomb.id, currentModule.id, { input });
      setResult(response.output);
      
      if (response.output.resolved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        
        if (response.output.possibleWords.length === 1) {
          const command = generateTwitchCommand({
            moduleType: ModuleType.PASSWORDS,
            result: { password: response.output.possibleWords[0] },
            moduleNumber: moduleNumber
          });
          setTwitchCommand(command);
        }
        
        // Save solution
        if (currentModule) {
          useRoundStore.getState().round?.bombs.forEach(bomb => {
            if (bomb.id === currentModule.bomb.id) {
              const module = bomb.modules.find(m => m.id === currentModule.id);
              if (module) {
                module.solution = { result: response.output, isSolved: true };
              }
            }
          });
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
    setTwitchCommand("");
    resetSolverState();
  };


  return (
    <SolverLayout>
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

      {/* Bomb info display */}
      <BombInfoDisplay bomb={bomb} />
      
      {/* Error display */}
      <ErrorAlert error={error} />

      {/* Twitch command display */}
      <TwitchCommandDisplay command={twitchCommand} />

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
                    ? 'bg-success text-neutral-content border-2 border-success shadow-lg shadow-success/25'
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
    </SolverLayout>
  );
}
