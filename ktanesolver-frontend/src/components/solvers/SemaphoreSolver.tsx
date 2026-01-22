import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveSemaphore, type SemaphoreOutput, type SemaphoreInput } from "../../services/semaphoreService";
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
import SemaphoreFlagSelector from "../SemaphoreFlagSelector";

interface SemaphoreSolverProps {
  bomb: BombEntity | null | undefined;
}

interface FlagAngles {
  leftFlagAngle: number;
  rightFlagAngle: number;
  character?: string;
}

export default function SemaphoreSolver({ bomb }: SemaphoreSolverProps) {
  const [sequence, setSequence] = useState<FlagAngles[]>([]);
  const [result, setResult] = useState<SemaphoreOutput | null>(null);
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
        sequence,
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
  }, [sequence, result, twitchCommand]);

  // Restore state from module when component loads
  useEffect(() => {
    if (currentModule?.state && typeof currentModule.state === 'object') {
      const moduleState = currentModule.state as { 
        sequence?: FlagAngles[];
        result?: SemaphoreOutput | null;
        twitchCommand?: string;
      };
      
      if (moduleState.sequence) setSequence(moduleState.sequence);
      if (moduleState.result !== undefined) setResult(moduleState.result);
      if (moduleState.twitchCommand) setTwitchCommand(moduleState.twitchCommand);
    }

    // Restore solution if module was solved
    if (currentModule?.solution && typeof currentModule.solution === 'object') {
      const solution = currentModule.solution as { 
        result?: SemaphoreOutput;
        isSolved?: boolean;
      };
      
      if (solution.result) {
        setResult(solution.result);
      }
      if (solution.isSolved) {
        setIsSolved(true);
      }
    }
  }, [currentModule, moduleNumber, setIsSolved]);

  const addPosition = (character: string, leftFlagAngle: number, rightFlagAngle: number) => {
    setSequence(prev => [...prev, { leftFlagAngle, rightFlagAngle, character }]);
  };

  const removeLastPosition = () => {
    setSequence(prev => prev.slice(0, -1));
  };

  const clearSequence = () => {
    setSequence([]);
    setResult(null);
    setTwitchCommand("");
  };


  const solveSemaphoreModule = async () => {
    if (sequence.length === 0) {
      setError("Please enter at least one semaphore position");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const input: SemaphoreInput = {
        sequence
      };
      
      const response = await solveSemaphore(round.id, bomb.id, currentModule.id, { input });
      
      setResult(response.output);
      
      if (response.output.resolved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        
        const command = generateTwitchCommand({
          moduleType: ModuleType.SEMAPHORE,
          result: { character: response.output.missingCharacter },
          moduleNumber
        });
        setTwitchCommand(command);
        
        // Save solution
        if (currentModule) {
          useRoundStore.getState().round?.bombs.forEach(bomb => {
            if (bomb.id === currentModule.bomb.id) {
              const module = bomb.modules.find(m => m.id === currentModule.id);
              if (module) {
                module.solution = { result: response.output };
              }
            }
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve semaphore");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    clearSequence();
    resetSolverState();
  };

  return (
    <SolverLayout>
      {/* Semaphore Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">SEMAPHORE MODULE</h3>
        
        {/* Display area */}
        <div className="bg-black rounded-lg p-4 mb-4 min-h-[120px] flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Sequence Builder</div>
            <div className="text-lg font-mono text-gray-300 mb-4">
              {sequence.length > 0 ? sequence.map(pos => 
                pos.character ? pos.character : `(${pos.leftFlagAngle}°, ${pos.rightFlagAngle}°)`
              ).join(' ') : 'No positions entered'}
            </div>
            {sequence.length > 0 && (
              <div className="text-sm text-gray-400">
                {sequence.length} position{sequence.length !== 1 ? 's' : ''} in sequence
              </div>
            )}
          </div>
        </div>

        {/* Flag selector - always visible */}
        <div className="mb-4">
          <SemaphoreFlagSelector
            onPositionSelect={addPosition}
            disabled={isLoading || isSolved}
          />
        </div>
        
        {/* Sequence controls */}
        <div className="flex gap-2">
          <button
            onClick={removeLastPosition}
            className="btn btn-sm btn-outline flex-1"
            disabled={sequence.length === 0 || isLoading || isSolved}
          >
            Remove Last
          </button>
          <button
            onClick={clearSequence}
            className="btn btn-sm btn-outline flex-1"
            disabled={sequence.length === 0 || isLoading || isSolved}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Bomb info display */}
      <BombInfoDisplay bomb={bomb} />
      
      {/* Controls */}
      <SolverControls
        onSolve={solveSemaphoreModule}
        onReset={reset}
        isSolveDisabled={sequence.length === 0}
        isLoading={isLoading}
        solveText="Press OK"
      />

      {/* Error display */}
      <ErrorAlert error={error} />

      {/* Results */}
      {result && (
        <div className={`alert mb-4 ${result.resolved ? "alert-success" : "alert-warning"}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            {result.resolved ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            )}
          </svg>
          <div>
            {result.resolved ? (
              <div>
                <span className="font-bold">Correct! The missing character is:</span>
                <div className="mt-2 font-mono text-2xl">{result.missingCharacter}</div>
              </div>
            ) : (
              <div>
                <span className="font-bold">Missing character:</span>
                <div className="mt-2 font-mono text-2xl">{result.missingCharacter}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Twitch command display */}
      {twitchCommand && result && result.resolved && (
        <TwitchCommandDisplay command={twitchCommand} />
      )}

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Enter the semaphore sequence you see on the module to find the character not in the serial number.</p>
        <p>• Select positions in order from left to right</p>
        <p>• The system will automatically find which character is missing from the serial number</p>
      </div>
    </div>
  );
}
