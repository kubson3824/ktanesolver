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
  SolverSection,
  SolverInstructions,
  SolverControls,
  SolverResult,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { cn } from "../../lib/cn";

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

function DialFace({ turns }: { turns: number }) {
  // Each click is 30 degrees (360 / 12). 0 = pointing up.
  const angle = (turns % 12) * 30;
  return (
    <div className="relative h-14 w-14">
      <div className="absolute inset-0 rounded-full border-2 border-border bg-muted/60" />
      {/* tick marks */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          aria-hidden
          className="absolute left-1/2 top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-full origin-bottom"
          style={{ transform: `translate(-50%, -100%) rotate(${i * 30}deg) translateY(-0.75rem)` }}
        >
          <div className="h-1 w-0.5 rounded-full bg-muted-foreground/40" />
        </div>
      ))}
      {/* pointer */}
      <div
        className="absolute left-1/2 top-1/2 h-6 w-0.5 -translate-x-1/2 origin-bottom bg-amber-500"
        style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)` }}
        aria-hidden
      />
      {/* hub */}
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500" />
      {/* number */}
      <div className="absolute inset-0 flex items-end justify-center pb-1">
        <span className="font-mono text-xs font-bold tabular-nums text-foreground">{turns}</span>
      </div>
    </div>
  );
}

export default function SafetySafeSolver({ bomb }: SafetySafeSolverProps) {
  const [result, setResult] = useState<SafetySafeOutput | null>(null);
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
    [result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: { result?: SafetySafeOutput | null; twitchCommand?: string }) => {
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: SafetySafeOutput) => {
    if (solution?.dialTurns?.length === 6) {
      setResult(solution);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.SAFETY_SAFE,
          result: { dialTurns: solution.dialTurns },
        }),
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
        true,
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
      <SolverSection
        title="Safety Safe"
        description="The solver uses bomb edgework only — no inputs needed. Find each dial's loud-click starting position, then rotate the listed number of clicks (0–11)."
      >
        {result ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DIAL_LABELS.map((label, i) => {
              const turns = result.dialTurns[i] ?? 0;
              return (
                <div
                  key={label}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3",
                  )}
                >
                  <DialFace turns={turns} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </div>
                    <div className="font-mono text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
                      {turns}{" "}
                      <span className="text-xs font-medium text-muted-foreground">
                        {turns === 1 ? "click" : "clicks"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
            Dial turns will appear here after solving.
          </div>
        )}
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={false}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result && (
        <SolverResult
          variant="success"
          title="On the module"
          description={`From each dial's loud click, rotate: ${result.dialTurns.join(", ")}\nOrder: Top Left → Bottom Right, then pull the lever.`}
        />
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Each dial has a <strong>tell</strong> — a louder click — that marks its starting position.
        From there, rotate the listed number of clicks. A full revolution is 12 clicks.
      </SolverInstructions>
    </SolverLayout>
  );
}
