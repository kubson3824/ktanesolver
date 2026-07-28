import { useCallback, useMemo, useState } from "react";

import { solveTheStopwatch, type TheStopwatchOutput } from "../../services/theStopwatchService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Input } from "../ui";

type PersistedState = {
  startMinutes: number;
  startSeconds: number;
  result: TheStopwatchOutput | null;
};

export default function TheStopwatchSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [startMinutes, setStartMinutes] = useState(5);
  const [startSeconds, setStartSeconds] = useState(0);
  const [result, setResult] = useState<TheStopwatchOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo<PersistedState>(
    () => ({ startMinutes, startSeconds, result }),
    [startMinutes, startSeconds, result],
  );

  useSolverModulePersistence<PersistedState, TheStopwatchOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (Number.isInteger(saved.startMinutes)) setStartMinutes(saved.startMinutes);
      if (Number.isInteger(saved.startSeconds)) setStartSeconds(saved.startSeconds);
      if (saved.result) setResult(saved.result);
    }, []),
    onRestoreSolution: useCallback((solution: TheStopwatchOutput) => setResult(solution), []),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!Number.isInteger(startMinutes) || startMinutes < 0
      || !Number.isInteger(startSeconds) || startSeconds < 0 || startSeconds > 59
      || startMinutes + startSeconds === 0) {
      return setError("Enter a valid bomb start time");
    }
    clearError();
    setIsLoading(true);
    try {
      const response = await solveTheStopwatch(round.id, bomb.id, currentModule.id, {
        bombStartTimeSeconds: startMinutes * 60 + startSeconds,
      });
      setResult(response.output);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...state, result: response.output }, response.output, response.solved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve The Stopwatch");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, startMinutes, startSeconds, state, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setStartMinutes(5);
    setStartSeconds(0);
    setResult(null);
    resetSolverState();
  }, [resetSolverState]);
  const twitchCommand = result
    ? generateTwitchCommand({ moduleType: ModuleType.THE_STOPWATCH, result })
    : "";

  return <SolverLayout>
    <SolverSection title="Bomb start time" description="Enter the bomb timer value when the lights turned on.">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <label className="text-sm font-medium">Minutes
          <Input type="number" min={0} value={startMinutes} onChange={(event) => setStartMinutes(Number(event.target.value))} disabled={isLoading || isSolved} className="mt-1" />
        </label>
        <span className="pb-2 text-xl font-bold" aria-hidden>:</span>
        <label className="text-sm font-medium">Seconds
          <Input type="number" min={0} max={59} value={startSeconds} onChange={(event) => setStartSeconds(Number(event.target.value))} disabled={isLoading || isSolved} className="mt-1" />
        </label>
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate runtime" />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Run the stopwatch for" className="border-emerald-500/40">
      <div className="rounded-xl border-4 border-emerald-500/50 bg-slate-950 p-6 text-center text-white" role="status" aria-live="polite">
        <time className="font-mono text-5xl font-bold tabular-nums">{result.formattedRuntime}</time>
        {result.runtimeSeconds !== result.baseRuntimeSeconds && <p className="mt-2 text-sm text-slate-300">
          Reduced from {Math.floor(result.baseRuntimeSeconds / 60)}:{String(result.baseRuntimeSeconds % 60).padStart(2, "0")} for this short bomb.
        </p>}
      </div>
    </SolverSection>}

    {twitchCommand
      ? <TwitchCommandDisplay command={twitchCommand} />
      : result && <p className="text-sm text-amber-700">The upstream Twitch parser cannot express runtimes of one minute or longer.</p>}
    <SolverInstructions>Press Start, wait the exact true runtime shown above, then press Stop. The module display is only a guide.</SolverInstructions>
  </SolverLayout>;
}
