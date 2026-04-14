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
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { useRoundStore } from "../../store/useRoundStore";

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
      if (state.frequencies && Array.isArray(state.frequencies))
        setFrequencies(state.frequencies);
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
    { frequencies: (ProbingFrequency | null)[]; result: ProbingOutput | null; twitchCommand: string },
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
    inferSolved: (_sol, mod) =>
      Boolean((mod as { solved?: boolean } | undefined)?.solved),
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
      const response = await solveProbing(
        round.id,
        bomb.id,
        currentModule.id,
        { input: { missingFrequenciesByWire: frequencies as number[] } },
      );
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
    if (isSolved) resetSolverState();
  };

  const allSelected = frequencies.every((f) => f !== null);

  return (
    <SolverLayout>
      <div className="rounded-xl border-2 border-neutral-600 bg-neutral-700/95 shadow-lg p-5 text-neutral-100 space-y-3">
        {Array.from({ length: WIRE_COUNT }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-neutral-400 w-12 shrink-0 uppercase tracking-wide">
              Wire {i + 1}
            </span>
            <div className="flex gap-1 flex-wrap">
              {PROBING_FREQUENCIES.map((freq) => {
                const selected = frequencies[i] === freq;
                return (
                  <button
                    key={freq}
                    onClick={() => setWireFrequency(i, freq)}
                    disabled={isSolved}
                    className={`px-3 py-1 rounded text-sm font-mono font-medium transition-colors ${
                      selected
                        ? "bg-sky-500 text-white"
                        : "bg-neutral-600 text-neutral-300 hover:bg-neutral-500"
                    }`}
                  >
                    {freq}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {result && (
        <div className="mt-4 rounded-xl border-2 border-neutral-600 bg-neutral-800/80 p-5 space-y-3">
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              <span className="text-sm text-neutral-200">
                Red clip &rarr; <span className="font-bold text-red-300">Wire {result.redClipWire}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
              <span className="text-sm text-neutral-200">
                Blue clip &rarr; <span className="font-bold text-blue-300">Wire {result.blueClipWire}</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-400">{result.instruction}</p>

          {result.redClipCandidates.length > 1 && (
            <p className="text-xs text-neutral-500">
              Other red candidates:{" "}
              {result.redClipCandidates
                .filter((w) => w !== result.redClipWire)
                .join(", ")}
            </p>
          )}
          {result.blueClipCandidates.length > 1 && (
            <p className="text-xs text-neutral-500">
              Other blue candidates:{" "}
              {result.blueClipCandidates
                .filter((w) => w !== result.blueClipWire)
                .join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="mt-4">
        <SolverControls
          onSolve={handleSolve}
          onReset={reset}
          isSolveDisabled={!allSelected}
          isLoading={isLoading}
          isSolved={isSolved}
          solveText="Solve"
        />
      </div>

      <ErrorAlert error={error} />
      <TwitchCommandDisplay command={twitchCommand} />
    </SolverLayout>
  );
}
