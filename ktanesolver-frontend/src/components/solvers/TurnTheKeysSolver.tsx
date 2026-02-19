import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveTurnTheKeys, type TurnTheKeysSolveResponse } from "../../services/turnTheKeysService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";

interface TurnTheKeysSolverProps {
  bomb: BombEntity | null | undefined;
}

type Output = TurnTheKeysSolveResponse["output"];

export default function TurnTheKeysSolver({ bomb }: TurnTheKeysSolverProps) {
  const [priorityInput, setPriorityInput] = useState<string>("");
  const [result, setResult] = useState<Output | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

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
    () => ({ priorityInput, result, twitchCommand }),
    [priorityInput, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      priorityInput?: string;
      result?: Output | null;
      twitchCommand?: string;
      priority?: number;
      leftKeyInstruction?: string;
      rightKeyInstruction?: string;
      canTurnRightKey?: boolean;
      canTurnLeftKey?: boolean;
      rightKeyTurned?: boolean;
      leftKeyTurned?: boolean;
    }) => {
      if (state.priorityInput !== undefined) setPriorityInput(state.priorityInput);
      else if (state.priority !== undefined) setPriorityInput(String(state.priority));
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
      if (state.result !== undefined) {
        setResult(state.result);
      } else if (
        (state.leftKeyInstruction !== undefined || state.rightKeyInstruction !== undefined) &&
        state.priority !== undefined
      ) {
        setResult({
          leftKeyInstruction: state.leftKeyInstruction ?? "",
          rightKeyInstruction: state.rightKeyInstruction ?? "",
          priority: state.priority,
          canTurnRightKey: state.canTurnRightKey ?? false,
          canTurnLeftKey: state.canTurnLeftKey ?? false,
          rightKeyTurned: state.rightKeyTurned ?? false,
          leftKeyTurned: state.leftKeyTurned ?? false,
        });
      }
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: Output) => {
    if (!solution) return;
    setResult(solution);
    setTwitchCommand(
      generateTwitchCommand({
        moduleType: ModuleType.TURN_THE_KEYS,
        result: solution,
      }),
    );
  }, []);

  useSolverModulePersistence<
    { priorityInput: string; result: Output | null; twitchCommand: string },
    Output
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const o = raw as {
          output?: Output;
          leftKeyInstruction?: string;
          rightKeyInstruction?: string;
          priority?: number;
          canTurnRightKey?: boolean;
          canTurnLeftKey?: boolean;
          rightKeyTurned?: boolean;
          leftKeyTurned?: boolean;
        };
        if (o.output && typeof o.output === "object") return o.output as Output;
        if (
          typeof o.leftKeyInstruction === "string" &&
          typeof o.rightKeyInstruction === "string" &&
          typeof o.priority === "number"
        ) {
          return {
            leftKeyInstruction: o.leftKeyInstruction,
            rightKeyInstruction: o.rightKeyInstruction,
            priority: o.priority,
            canTurnRightKey: o.canTurnRightKey ?? false,
            canTurnLeftKey: o.canTurnLeftKey ?? false,
            rightKeyTurned: o.rightKeyTurned ?? false,
            leftKeyTurned: o.leftKeyTurned ?? false,
          };
        }
      }
      return null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const runSolve = useCallback(
    async (payload: { priority: number; rightKeyTurned?: boolean; leftKeyTurned?: boolean }) => {
      if (!round?.id || !bomb?.id || !currentModule?.id) {
        setError("Missing required information");
        return;
      }
      clearError();
      setIsLoading(true);
      try {
        const response = await solveTurnTheKeys(round.id, bomb.id, currentModule.id, payload);
        setResult(response.output);
        setTwitchCommand(
          generateTwitchCommand({
            moduleType: ModuleType.TURN_THE_KEYS,
            result: response.output,
          }),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to solve Turn The Keys");
      } finally {
        setIsLoading(false);
      }
    },
    [round?.id, bomb?.id, currentModule?.id, clearError, setError, setIsLoading],
  );

  const handleSolve = async () => {
    const priority = parseInt(priorityInput.trim(), 10);
    if (priorityInput.trim() === "" || isNaN(priority) || priority < 0) {
      setError("Enter a valid priority (0 or greater) from the display.");
      return;
    }
    await runSolve({ priority });
    if (round?.id && bomb?.id && currentModule?.id) {
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
    }
  };

  const handleTurnedRightKey = useCallback(async () => {
    if (!result) return;
    await runSolve({
      priority: result.priority,
      rightKeyTurned: true,
    });
  }, [result, runSolve]);

  const handleTurnedLeftKey = useCallback(async () => {
    if (!result) return;
    await runSolve({
      priority: result.priority,
      leftKeyTurned: true,
    });
  }, [result, runSolve]);

  const reset = () => {
    setPriorityInput("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const priorityNum = useMemo(() => {
    const p = parseInt(priorityInput.trim(), 10);
    return priorityInput.trim() !== "" && !isNaN(p) && p >= 0 ? p : null;
  }, [priorityInput]);
  const canSolve = priorityNum !== null;

  return (
    <SolverLayout>
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">TURN THE KEYS</h3>
        <p className="text-center text-base-content/80 text-sm mb-4">
          This module has two keys and a display showing its priority. Enter the priority number to see when to turn each key.
        </p>

        <div className="flex flex-wrap items-end gap-4 justify-center mb-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Priority (from display)</span>
            </label>
            <input
              type="number"
              min={0}
              value={priorityInput}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                if (v === "" || parseInt(v, 10) >= 0) {
                  setPriorityInput(v);
                  if (error) clearError();
                }
              }}
              placeholder="0"
              className="input input-bordered w-24 text-center"
              disabled={isLoading || isSolved}
            />
          </div>
        </div>
      </div>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!canSolve || isSolved}
        isLoading={isLoading}
        solveText="Show instructions"
      />

      <ErrorAlert error={error} />

      {result && (
        <div className="space-y-4 mb-4">
          <p className="text-sm text-base-content/70 font-medium">This module&apos;s priority: {result.priority}</p>

          {result.canTurnRightKey && (
            <div className="alert alert-success">
              <span className="font-bold">You can turn the right key now.</span>
            </div>
          )}
          {result.canTurnLeftKey && (
            <div className="alert alert-success">
              <span className="font-bold">You can turn the left key now.</span>
            </div>
          )}

          {!result.rightKeyTurned && (
            <div className="alert alert-info">
              <span className="font-bold block mb-2">Right key</span>
              <span className="text-sm">{result.rightKeyInstruction}</span>
              <div className="mt-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={handleTurnedRightKey}
                  disabled={isLoading}
                >
                  I turned the right key
                </button>
              </div>
            </div>
          )}
          {!result.leftKeyTurned && (
            <div className="alert alert-info">
              <span className="font-bold block mb-2">Left key</span>
              <span className="text-sm">{result.leftKeyInstruction}</span>
              <div className="mt-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={handleTurnedLeftKey}
                  disabled={isLoading}
                >
                  I turned the left key
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <TwitchCommandDisplay command={twitchCommand} />

      <div className="text-sm text-base-content/60">
        <p className="mb-2">Order is everything. Turn the right keys first (higher priority first), then the left keys (lower priority first), following the module rules.</p>
      </div>
    </SolverLayout>
  );
}
