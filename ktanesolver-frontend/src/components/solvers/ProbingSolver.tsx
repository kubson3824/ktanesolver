import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import {
  solveProbing,
  type ProbingOutput,
  type ProbingFrequency,
  PROBING_FREQUENCIES,
} from "../../services/probingService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
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
import { useRoundStore } from "../../store/useRoundStore";
import { cn } from "../../lib/cn";

interface ProbingSolverProps {
  bomb: BombEntity | null | undefined;
}

const WIRE_COUNT = 6;

export default function ProbingSolver({ bomb }: ProbingSolverProps) {
  const [frequencies, setFrequencies] = useState<(ProbingFrequency | null)[]>(
    Array(WIRE_COUNT).fill(null),
  );
  const [result, setResult] = useState<ProbingOutput | null>(null);
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
    () => ({ frequencies, result, twitchCommand }),
    [frequencies, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      frequencies?: (ProbingFrequency | null)[];
      result?: ProbingOutput | null;
      twitchCommand?: string;
    }) => {
      if (state.frequencies && Array.isArray(state.frequencies)) setFrequencies(state.frequencies);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: ProbingOutput) => {
    setResult(solution);
    setTwitchCommand(
      generateTwitchCommand({ moduleType: ModuleType.PROBING, result: solution }),
    );
  }, []);

  useSolverModulePersistence<
    {
      frequencies: (ProbingFrequency | null)[];
      result: ProbingOutput | null;
      twitchCommand: string;
    },
    ProbingOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null || typeof raw !== "object") return null;
      const v = raw as Partial<ProbingOutput>;
      if (
        typeof v.redClipWire === "number" &&
        typeof v.blueClipWire === "number" &&
        typeof v.instruction === "string"
      ) {
        return raw as ProbingOutput;
      }
      return null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }
    if (frequencies.some((f) => f === null)) {
      setError("Select a frequency for every wire.");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveProbing(round.id, bomb.id, currentModule.id, {
        input: { missingFrequenciesByWire: frequencies as number[] },
      });
      const output = response.output;
      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({
        moduleType: ModuleType.PROBING,
        result: output,
      });
      setTwitchCommand(command);

      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { frequencies, result: output, twitchCommand: command },
        output,
        true,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Solve failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFrequencies(Array(WIRE_COUNT).fill(null));
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const setWireFrequency = (wireIndex: number, freq: ProbingFrequency) => {
    setFrequencies((prev) => {
      const next = [...prev];
      next[wireIndex] = freq;
      return next;
    });
  };

  const allSelected = frequencies.every((f) => f !== null);
  const disabled = isLoading || isSolved;

  return (
    <SolverLayout>
      <SolverSection
        title="Wire frequencies"
        description="Probe each wire pair and record the missing frequency for each of the 6 wires."
      >
        <div className="space-y-2">
          {Array.from({ length: WIRE_COUNT }, (_, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2"
            >
              <span className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Wire {i + 1}
              </span>
              <div className="flex flex-wrap gap-1">
                {PROBING_FREQUENCIES.map((freq) => {
                  const selected = frequencies[i] === freq;
                  return (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setWireFrequency(i, freq)}
                      disabled={disabled}
                      aria-pressed={selected}
                      className={cn(
                        "inline-flex items-center justify-center rounded-md border px-2.5 py-1 font-mono text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected
                          ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300"
                          : "border-border bg-muted/40 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                        disabled && "cursor-not-allowed opacity-60",
                      )}
                    >
                      {freq}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!allSelected}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Clip placement" className="border-emerald-500/40">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2">
              <span
                aria-hidden
                className="inline-flex h-3 w-3 shrink-0 rounded-full bg-red-500"
              />
              <span className="text-sm text-foreground">
                Red clip →{" "}
                <span className="font-semibold text-red-700 dark:text-red-300">
                  Wire {result.redClipWire}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-blue-500/40 bg-blue-500/10 px-3 py-2">
              <span
                aria-hidden
                className="inline-flex h-3 w-3 shrink-0 rounded-full bg-blue-500"
              />
              <span className="text-sm text-foreground">
                Blue clip →{" "}
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                  Wire {result.blueClipWire}
                </span>
              </span>
            </div>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">{result.instruction}</p>

          {(result.redClipCandidates.length > 1 || result.blueClipCandidates.length > 1) && (
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              {result.redClipCandidates.length > 1 && (
                <p>
                  Other red candidates:{" "}
                  <span className="font-mono">
                    {result.redClipCandidates
                      .filter((w) => w !== result.redClipWire)
                      .join(", ")}
                  </span>
                </p>
              )}
              {result.blueClipCandidates.length > 1 && (
                <p>
                  Other blue candidates:{" "}
                  <span className="font-mono">
                    {result.blueClipCandidates
                      .filter((w) => w !== result.blueClipWire)
                      .join(", ")}
                  </span>
                </p>
              )}
            </div>
          )}
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Probe every pair of wires to learn which two frequencies are present on each
        wire. Record the missing frequency for each wire; the solver identifies where
        the red and blue clips go.
      </SolverInstructions>
    </SolverLayout>
  );
}
