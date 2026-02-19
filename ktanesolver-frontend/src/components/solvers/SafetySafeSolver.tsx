import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import {
  solveSafetySafe,
  type SafetySafeOutput,
} from "../../services/safetySafeService";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";

const DIAL_LABELS = [
  "Top Left",
  "Top Middle",
  "Top Right",
  "Bottom Left",
  "Bottom Middle",
  "Bottom Right",
] as const;

interface SafetySafeSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function SafetySafeSolver({ bomb }: SafetySafeSolverProps) {
  const [result, setResult] = useState<SafetySafeOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const {
    isLoading,
    error,
    setIsLoading,
    setError,
    setIsSolved,
    clearError,
    reset: resetSolverState,
    currentModule,
    round,
    markModuleSolved,
  } = useSolver();

  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);

  const moduleState = useMemo(
    () => ({ result, twitchCommand }),
    [result, twitchCommand]
  );

  const onRestoreState = useCallback(
    (state: { result?: SafetySafeOutput | null; twitchCommand?: string }) => {
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    []
  );

  const onRestoreSolution = useCallback((solution: SafetySafeOutput) => {
    if (solution?.dialTurns?.length === 6) {
      setResult(solution);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.SAFETY_SAFE,
          result: { dialTurns: solution.dialTurns },
        })
      );
    }
  }, []);

  useSolverModulePersistence<
    { result: SafetySafeOutput | null; twitchCommand: string },
    SafetySafeOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      const o = raw as { dialTurns?: unknown };
      if (Array.isArray(o.dialTurns) && o.dialTurns.length === 6) {
        return raw as SafetySafeOutput;
      }
      return null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveSafetySafe(round.id, bomb.id, currentModule.id, {
        input: {},
      });

      const output = response.output;
      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({
        moduleType: ModuleType.SAFETY_SAFE,
        result: { dialTurns: output.dialTurns },
      });
      setTwitchCommand(command);

      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { result: output, twitchCommand: command },
        { dialTurns: output.dialTurns },
        true
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Solve failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
      <div className="rounded-xl border-2 border-neutral-600 bg-neutral-700/95 shadow-lg p-5 text-neutral-100">
        <p className="text-sm text-neutral-300 mb-4">
          Each dial has a tell where it clicks louder—that is the starting position. The solver uses the bomb&apos;s serial, port types, and indicators to compute how many turns (0–11) to rotate each dial from that starting position. Turn the lever to check; green = correct, red = wrong.
        </p>

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {DIAL_LABELS.map((label, i) => (
                <div
                  key={label}
                  className="rounded-lg bg-neutral-800/80 border border-neutral-600 p-3 flex items-center justify-between"
                >
                  <span className="text-neutral-200 text-sm font-medium">
                    {label}
                  </span>
                  <span className="text-amber-400 font-mono font-bold text-lg">
                    {result.dialTurns[i] ?? "—"}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-neutral-400 text-sm">
              From each dial&apos;s loud click, rotate that many positions (0 = leave it, 1 = one click, etc.). A full rotation is 12 clicks.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <SolverControls
          onSolve={handleSolve}
          onReset={reset}
          isSolveDisabled={false}
          isLoading={isLoading}
          solveText="Solve"
        />
      </div>

      <ErrorAlert error={error} />

      {result && (
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
            <p className="font-bold">On the module</p>
            <p className="text-sm mt-1">
              From each dial&apos;s loud click, rotate: {result.dialTurns.join(", ")} turns (Top Left → Bottom Right). Then turn the lever to check.
            </p>
          </div>
        </div>
      )}

      <TwitchCommandDisplay command={twitchCommand} />
    </SolverLayout>
  );
}
