import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveSemaphore, getDisplayLabel, type SemaphoreOutput, type SemaphoreInput } from "../../services/semaphoreService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
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
  } = useSolver();

  const moduleState = useMemo(
    () => ({ sequence, result, twitchCommand }),
    [sequence, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: { sequence?: FlagAngles[]; result?: SemaphoreOutput | null; twitchCommand?: string; input?: { sequence?: FlagAngles[] } }) => {
      const enrich = (seq: FlagAngles[]) =>
        seq.map((pos) => ({
          ...pos,
          character: pos.character ?? getDisplayLabel(pos.leftFlagAngle, pos.rightFlagAngle),
        }));
      if (state.sequence) setSequence(enrich(state.sequence));
      if (state.result !== undefined) setResult(state.result ?? null);
      if (state.twitchCommand) setTwitchCommand(state.twitchCommand);
      if (state.input?.sequence) setSequence(enrich(state.input.sequence));
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (restored: SemaphoreOutput) => {
      if (restored) {
        setResult(restored);

        const command = generateTwitchCommand({
          moduleType: ModuleType.SEMAPHORE,
          result: { character: restored.missingCharacter },
        });
        setTwitchCommand(command);
      }
    },
  []);

  useSolverModulePersistence<
    { sequence: FlagAngles[]; result: SemaphoreOutput | null; twitchCommand: string },
    SemaphoreOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; result?: unknown; solution?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as SemaphoreOutput;
        if (anyRaw.result && typeof anyRaw.result === "object") return anyRaw.result as SemaphoreOutput;
        if (anyRaw.solution && typeof anyRaw.solution === "object") return anyRaw.solution as SemaphoreOutput;
        return raw as SemaphoreOutput;
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

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
          result: response.output,
        });
        setTwitchCommand(command);
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
      <div className="bg-gray-800 rounded-lg p-6 mb-4 flex flex-col min-h-0">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium flex-shrink-0">SEMAPHORE MODULE</h3>

        {/* Display area */}
        <div className="bg-black rounded-lg p-4 mb-4 min-h-[120px] flex flex-col items-center justify-center flex-shrink-0">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Sequence Builder</div>
            <div className="text-lg font-mono text-gray-300 mb-4">
              {sequence.length > 0 ? sequence.map(pos =>
                pos.character ?? getDisplayLabel(pos.leftFlagAngle, pos.rightFlagAngle)
              ).join(' ') : 'No positions entered'}
            </div>
            {sequence.length > 0 && (
              <div className="text-sm text-gray-400">
                {sequence.length} position{sequence.length !== 1 ? 's' : ''} in sequence
              </div>
            )}
          </div>
        </div>

        {/* Flag selector - fills available space */}
        <div className="mb-4 flex-1 min-h-0 flex flex-col">
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
    </SolverLayout>
  );
}
