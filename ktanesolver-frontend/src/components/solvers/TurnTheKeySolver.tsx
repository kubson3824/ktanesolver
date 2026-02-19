import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveTurnTheKey, type TurnTheKeySolveResponse } from "../../services/turnTheKeyService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";

interface TurnTheKeySolverProps {
  bomb: BombEntity | null | undefined;
}

function formatMmSs(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

export default function TurnTheKeySolver({ bomb }: TurnTheKeySolverProps) {
  const [minutes, setMinutes] = useState<string>("");
  const [seconds, setSeconds] = useState<string>("");
  const [result, setResult] = useState<TurnTheKeySolveResponse["output"] | null>(null);
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
    () => ({ minutes, seconds, result, twitchCommand }),
    [minutes, seconds, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      minutes?: string;
      seconds?: string;
      result?: TurnTheKeySolveResponse["output"] | null;
      twitchCommand?: string;
      turnWhenSeconds?: number;
      instruction?: string;
    }) => {
      if (state.minutes !== undefined) setMinutes(state.minutes);
      if (state.seconds !== undefined) setSeconds(state.seconds);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
      if (state.result !== undefined) {
        setResult(state.result);
      } else if (state.turnWhenSeconds !== undefined || state.instruction !== undefined) {
        setResult(
          state.turnWhenSeconds !== undefined && state.instruction !== undefined
            ? { turnWhenSeconds: state.turnWhenSeconds, instruction: state.instruction }
            : state.turnWhenSeconds !== undefined
              ? { turnWhenSeconds: state.turnWhenSeconds, instruction: "Turn the key when the timer shows " + formatMmSs(state.turnWhenSeconds) }
              : null,
        );
      }
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: TurnTheKeySolveResponse["output"]) => {
      if (!solution) return;
      setResult(solution);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.TURN_THE_KEY,
          result: solution,
        }),
      );
    },
    [],
  );

  useSolverModulePersistence<
    { minutes: string; seconds: string; result: TurnTheKeySolveResponse["output"] | null; twitchCommand: string },
    TurnTheKeySolveResponse["output"]
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; turnWhenSeconds?: number; instruction?: string };
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as TurnTheKeySolveResponse["output"];
        if (typeof anyRaw.turnWhenSeconds === "number" && anyRaw.instruction) return { turnWhenSeconds: anyRaw.turnWhenSeconds, instruction: anyRaw.instruction };
      }
      return null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSolve = async () => {
    const m = parseInt(minutes, 10);
    const s = parseInt(seconds, 10);
    if (isNaN(m) || isNaN(s) || m < 0 || m > 99 || s < 0 || s > 59) {
      setError("Enter valid time: minutes 0–99, seconds 0–59");
      return;
    }
    const displayTimeSeconds = m * 60 + s;

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    clearError();
    setIsLoading(true);

    try {
      const response = await solveTurnTheKey(round.id, bomb.id, currentModule.id, { displayTimeSeconds });
      setResult(response.output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.TURN_THE_KEY,
          result: response.output,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Turn The Key");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setMinutes("");
    setSeconds("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const totalSeconds = useMemo(() => {
    const m = parseInt(minutes, 10);
    const s = parseInt(seconds, 10);
    if (isNaN(m) || isNaN(s) || m < 0 || m > 99 || s < 0 || s > 59) return null;
    return m * 60 + s;
  }, [minutes, seconds]);
  const canSolve = totalSeconds !== null && totalSeconds <= 99 * 60 + 59;

  return (
    <SolverLayout>
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">TURN THE KEY</h3>
        <p className="text-center text-base-content/80 text-sm mb-4">
          Enter the time shown on the module display. Turn the key when the bomb timer matches this time.
        </p>

        <div className="flex flex-wrap items-end gap-4 justify-center mb-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Minutes (0–99)</span>
            </label>
            <input
              type="number"
              min={0}
              max={99}
              value={minutes}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                if (v === "" || (parseInt(v, 10) >= 0 && parseInt(v, 10) <= 99)) {
                  setMinutes(v);
                  if (error) clearError();
                }
              }}
              placeholder="0"
              className="input input-bordered w-20 text-center"
              disabled={isLoading || isSolved}
            />
          </div>
          <span className="text-xl font-bold text-base-content/70 pb-2">:</span>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Seconds (0–59)</span>
            </label>
            <input
              type="number"
              min={0}
              max={59}
              value={seconds}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                if (v === "" || (parseInt(v, 10) >= 0 && parseInt(v, 10) <= 59)) {
                  setSeconds(v);
                  if (error) clearError();
                }
              }}
              placeholder="00"
              className="input input-bordered w-20 text-center"
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
        solveText="Set time"
      />

      <ErrorAlert error={error} />

      {result && (
        <div className="alert alert-success mb-4">
          <span className="font-bold">{result.instruction}</span>
        </div>
      )}

      <TwitchCommandDisplay command={twitchCommand} />

      <div className="text-sm text-base-content/60">
        <p className="mb-2">Turn the key when the bomb&apos;s timer matches the time on the display, no sooner, no later.</p>
        <p>Enter the time shown (e.g. 1:23 = 1 min 23 sec) and use the solution as your reminder.</p>
      </div>
    </SolverLayout>
  );
}
