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
import { Button } from "../ui/button";
import { Alert } from "../ui/alert";

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
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={removeLastPosition}
            disabled={sequence.length === 0 || isLoading || isSolved}
          >
            Remove Last
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={clearSequence}
            disabled={sequence.length === 0 || isLoading || isSolved}
          >
            Clear All
          </Button>
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
        <Alert variant={result.resolved ? "success" : "warning"} className="mb-4">
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
        </Alert>
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
