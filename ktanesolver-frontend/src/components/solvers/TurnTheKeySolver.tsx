import { useCallback, useMemo, useState } from "react";
import { Timer } from "lucide-react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveTurnTheKey, type TurnTheKeySolveResponse } from "../../services/turnTheKeyService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { Input } from "../ui/input";

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
  const disabled = isLoading || isSolved;

  return (
    <SolverLayout>
      <SolverSection
        title="Module display time"
        description="Enter the time shown on the module's display in minutes and seconds."
      >
        <div className="flex items-end justify-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <label
              htmlFor="ttk-minutes"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Minutes
            </label>
            <Input
              id="ttk-minutes"
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
              disabled={disabled}
              aria-label="Minutes (0–99)"
              className="w-24 text-center font-mono text-3xl tracking-widest"
            />
          </div>
          <span
            aria-hidden
            className="pb-2 font-mono text-3xl font-bold text-muted-foreground"
          >
            :
          </span>
          <div className="flex flex-col items-center gap-1">
            <label
              htmlFor="ttk-seconds"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Seconds
            </label>
            <Input
              id="ttk-seconds"
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
              disabled={disabled}
              aria-label="Seconds (0–59)"
              className="w-24 text-center font-mono text-3xl tracking-widest"
            />
          </div>
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!canSolve}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Set time"
      />

      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Turn the key" className="border-emerald-500/40">
          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2">
              <Timer
                className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
              <span className="font-mono text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                {formatMmSs(result.turnWhenSeconds)}
              </span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {result.instruction}
            </p>
          </div>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Turn the key exactly when the bomb timer reaches the time above — no sooner,
        no later. Enter 1:23 as minutes 1 and seconds 23.
      </SolverInstructions>
    </SolverLayout>
  );
}
