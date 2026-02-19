import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import {
  solvePlumbing,
  type PlumbingOutput,
} from "../../services/plumbingService";
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

const PIPE_COLORS = ["Red", "Yellow", "Green", "Blue"] as const;

interface PlumbingSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function PlumbingSolver({ bomb }: PlumbingSolverProps) {
  const [result, setResult] = useState<PlumbingOutput | null>(null);
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

  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);

  const moduleState = useMemo(
    () => ({ result, twitchCommand }),
    [result, twitchCommand]
  );

  const onRestoreState = useCallback(
    (state: { result?: PlumbingOutput | null; twitchCommand?: string }) => {
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    []
  );

  const onRestoreSolution = useCallback((solution: PlumbingOutput) => {
    if (solution?.activeInputs?.length && solution?.activeOutputs?.length) {
      setResult(solution);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.PLUMBING,
          result: {
            activeInputs: solution.activeInputs,
            activeOutputs: solution.activeOutputs,
          },
        })
      );
    }
  }, []);

  useSolverModulePersistence<
    { result: PlumbingOutput | null; twitchCommand: string },
    PlumbingOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      const o = raw as { activeInputs?: unknown; activeOutputs?: unknown };
      if (
        Array.isArray(o.activeInputs) &&
        Array.isArray(o.activeOutputs)
      ) {
        return raw as PlumbingOutput;
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
      const response = await solvePlumbing(round.id, bomb.id, currentModule.id, {
        input: {},
      });

      const output = response.output;
      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({
        moduleType: ModuleType.PLUMBING,
        result: {
          activeInputs: output.activeInputs,
          activeOutputs: output.activeOutputs,
        },
      });
      setTwitchCommand(command);

      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { result: output, twitchCommand: command },
        {
          activeInputs: output.activeInputs,
          activeOutputs: output.activeOutputs,
        },
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

  const activeInputLabels = result
    ? result.activeInputs
        .map((active, i) => (active ? PIPE_COLORS[i] : null))
        .filter(Boolean)
    : [];
  const activeOutputLabels = result
    ? result.activeOutputs
        .map((active, i) => (active ? PIPE_COLORS[i] : null))
        .filter(Boolean)
    : [];

  return (
    <SolverLayout>
      <div className="rounded-xl border-2 border-neutral-600 bg-neutral-700/95 shadow-lg p-5 text-neutral-100">
        <p className="text-sm text-neutral-300 mb-4">
          The solver uses the bomb&apos;s serial, batteries, ports, and indicators to determine which input pipes (left) and output pipes (right) are active. Connect each active input to an active output through the 6×6 grid on the module.
        </p>

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg bg-neutral-800/80 border border-neutral-600 p-4">
                <h3 className="text-amber-400 font-semibold mb-2 text-sm uppercase tracking-wide">
                  Active inputs (left)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {PIPE_COLORS.map((color, i) => (
                    <span
                      key={color}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-sm font-medium ${
                        result.activeInputs[i]
                          ? color === "Red"
                            ? "bg-red-600/80 text-white"
                            : color === "Yellow"
                              ? "bg-amber-500/80 text-neutral-900"
                              : color === "Green"
                                ? "bg-green-600/80 text-white"
                                : "bg-blue-600/80 text-white"
                          : "bg-neutral-600/60 text-neutral-500 line-through"
                      }`}
                    >
                      {color}
                    </span>
                  ))}
                </div>
                <p className="text-neutral-400 text-xs mt-2">
                  Connect these: {activeInputLabels.join(", ") || "—"}
                </p>
              </div>
              <div className="rounded-lg bg-neutral-800/80 border border-neutral-600 p-4">
                <h3 className="text-amber-400 font-semibold mb-2 text-sm uppercase tracking-wide">
                  Active outputs (right)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {PIPE_COLORS.map((color, i) => (
                    <span
                      key={color}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-sm font-medium ${
                        result.activeOutputs[i]
                          ? color === "Red"
                            ? "bg-red-600/80 text-white"
                            : color === "Yellow"
                              ? "bg-amber-500/80 text-neutral-900"
                              : color === "Green"
                                ? "bg-green-600/80 text-white"
                                : "bg-blue-600/80 text-white"
                          : "bg-neutral-600/60 text-neutral-500 line-through"
                      }`}
                    >
                      {color}
                    </span>
                  ))}
                </div>
                <p className="text-neutral-400 text-xs mt-2">
                  To these: {activeOutputLabels.join(", ") || "—"}
                </p>
              </div>
            </div>
            <p className="text-neutral-400 text-sm">
              Rotate pipes in the 6×6 grid so every active input is connected to an active output. Do not connect inactive pipes. Press CHECK on the module to verify.
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
              Connect active inputs ({activeInputLabels.join(", ")}) to active outputs ({activeOutputLabels.join(", ")}) through the grid, then press CHECK.
            </p>
          </div>
        </div>
      )}

      <TwitchCommandDisplay command={twitchCommand} />
    </SolverLayout>
  );
}
