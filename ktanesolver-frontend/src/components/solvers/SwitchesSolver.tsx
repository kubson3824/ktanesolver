import { useCallback, useMemo, useState } from "react";
import { Lightbulb } from "lucide-react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  solveSwitches,
  type SwitchesInput,
  type SwitchesOutput,
} from "../../services/switchesService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverResult,
} from "../common";
import { Button } from "../ui/button";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcut";
import { cn } from "../../lib/cn";

interface SwitchesSolverProps {
  bomb: BombEntity | null | undefined;
}

const FORBIDDEN_MESSAGE = "Current switch configuration is invalid";

export default function SwitchesSolver({ bomb }: SwitchesSolverProps) {
  const [currentSwitches, setCurrentSwitches] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [ledPositions, setLedPositions] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [result, setResult] = useState<SwitchesOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const {
    isLoading,
    error,
    isSolved,
    clearError,
    reset,
    setIsLoading,
    setError,
    setIsSolved,
    currentModule,
    round,
    markModuleSolved,
  } = useSolver();

  const moduleState = useMemo(
    () => ({ currentSwitches, ledPositions, result, twitchCommand }),
    [currentSwitches, ledPositions, result, twitchCommand],
  );

  const defaultSwitches = useMemo(() => [false, false, false, false, false] as boolean[], []);

  const onRestoreState = useCallback(
    (state: {
      currentSwitches?: boolean[];
      ledPositions?: boolean[];
      result?: SwitchesOutput | null;
      twitchCommand?: string;
    }) => {
      const switches =
        Array.isArray(state.currentSwitches) && state.currentSwitches.length === 5
          ? state.currentSwitches
          : defaultSwitches;
      const leds =
        Array.isArray(state.ledPositions) && state.ledPositions.length === 5
          ? state.ledPositions
          : defaultSwitches;
      setCurrentSwitches(switches);
      setLedPositions(leds);
      setResult(state.result ?? null);
      setTwitchCommand(typeof state.twitchCommand === "string" ? state.twitchCommand : "");
    },
    [defaultSwitches],
  );

  const onRestoreSolution = useCallback((solution: SwitchesOutput) => {
    if (solution.instruction) {
      setResult(solution);
      setCurrentStepIndex(0);
      const command = generateTwitchCommand({
        moduleType: ModuleType.SWITCHES,
        result: { instruction: solution.instruction },
      });
      setTwitchCommand(command);
    }
  }, []);

  useSolverModulePersistence<
    {
      currentSwitches: boolean[];
      ledPositions: boolean[];
      result: SwitchesOutput | null;
      twitchCommand: string;
    },
    SwitchesOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => (raw && typeof raw === "object" ? (raw as SwitchesOutput) : null),
    inferSolved: (solution) => Boolean(solution?.solved),
    currentModule,
    setIsSolved,
  });

  const toggleSwitch = useCallback(
    (index: number) => {
      if (isLoading || isSolved) return;
      const newSwitches = [...currentSwitches];
      newSwitches[index] = !newSwitches[index];
      setCurrentSwitches(newSwitches);
      clearError();
    },
    [currentSwitches, isLoading, isSolved, clearError],
  );

  const setLedLitTop = useCallback(
    (index: number) => {
      if (isLoading || isSolved) return;
      const next = [...ledPositions];
      next[index] = true;
      setLedPositions(next);
      clearError();
    },
    [ledPositions, isLoading, isSolved, clearError],
  );

  const setLedLitBottom = useCallback(
    (index: number) => {
      if (isLoading || isSolved) return;
      const next = [...ledPositions];
      next[index] = false;
      setLedPositions(next);
      clearError();
    },
    [ledPositions, isLoading, isSolved, clearError],
  );

  useKeyboardShortcuts(
    useMemo(
      () =>
        [1, 2, 3, 4, 5].map((num) => ({
          key: String(num),
          handler: () => toggleSwitch(num - 1),
          enabled: !isLoading && !isSolved,
        })),
      [toggleSwitch, isLoading, isSolved],
    ),
  );

  const solveSwitchesModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const input: SwitchesInput = {
        currentSwitches,
        ledPositions,
      };

      const response = await solveSwitches(round.id, bomb.id, currentModule.id, {
        input,
      });

      setResult(response.output);
      setCurrentStepIndex(0);

      if (response.output?.solved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);

        const command = generateTwitchCommand({
          moduleType: ModuleType.SWITCHES,
          result: response.output,
        });
        setTwitchCommand(command);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve switches");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAll = () => {
    setCurrentSwitches([false, false, false, false, false]);
    setLedPositions([false, false, false, false, false]);
    setResult(null);
    setTwitchCommand("");
    setCurrentStepIndex(0);
    reset();
  };

  const isForbiddenResult = Boolean(
    result && !result.solved && result.instruction?.includes(FORBIDDEN_MESSAGE),
  );
  const solutionSteps = Array.isArray(result?.solutionSteps) ? result.solutionSteps : [];
  const currentStepSwitch = solutionSteps.length
    ? solutionSteps[Math.min(currentStepIndex, solutionSteps.length - 1)]
    : null;

  const ledsSafe = ledPositions ?? defaultSwitches;
  const switchesSafe = currentSwitches ?? defaultSwitches;

  return (
    <SolverLayout>
      <SolverSection
        title="Module state"
        description="Flip each switch and click the lit LED (top or bottom) for each position. Use keys 1–5 to flip switches."
      >
        <div
          className="grid grid-cols-5 gap-3 rounded-md border border-border bg-muted/20 p-4"
          role="group"
          aria-label="Switches"
        >
          {switchesSafe.map((isUp, index) => {
            const switchNum = index + 1;
            const isCurrentStep = currentStepSwitch === switchNum;
            const topLit = ledsSafe[index];
            const bottomLit = !ledsSafe[index];
            return (
              <div key={index} className="flex flex-col items-center gap-1.5">
                {/* Top LED */}
                <button
                  type="button"
                  onClick={() => setLedLitTop(index)}
                  disabled={isLoading || isSolved}
                  aria-label={`Switch ${switchNum}, top LED ${topLit ? "lit" : "unlit"}`}
                  aria-pressed={topLit}
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    topLit
                      ? "border-amber-400 bg-amber-400/20"
                      : "border-border bg-muted/40 hover:border-foreground/30",
                    (isLoading || isSolved) && "cursor-not-allowed opacity-60",
                  )}
                >
                  <Lightbulb
                    className={cn(
                      "h-3.5 w-3.5",
                      topLit ? "text-amber-400 fill-amber-400/70" : "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                </button>

                {/* Switch body */}
                <button
                  type="button"
                  onClick={() => toggleSwitch(index)}
                  disabled={isLoading || isSolved}
                  aria-label={`Switch ${switchNum}, ${isUp ? "up" : "down"}`}
                  aria-pressed={isUp}
                  className={cn(
                    "relative h-20 w-12 rounded-md border bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isCurrentStep
                      ? "border-emerald-500 ring-2 ring-emerald-500/40"
                      : "border-border hover:border-foreground/30",
                    (isLoading || isSolved) && "cursor-not-allowed opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-1/2 h-8 w-8 -translate-x-1/2 rounded bg-foreground/80 transition-all duration-200",
                      isUp ? "top-1" : "bottom-1",
                    )}
                    aria-hidden
                  />
                </button>

                {/* Bottom LED */}
                <button
                  type="button"
                  onClick={() => setLedLitBottom(index)}
                  disabled={isLoading || isSolved}
                  aria-label={`Switch ${switchNum}, bottom LED ${bottomLit ? "lit" : "unlit"}`}
                  aria-pressed={bottomLit}
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    bottomLit
                      ? "border-amber-400 bg-amber-400/20"
                      : "border-border bg-muted/40 hover:border-foreground/30",
                    (isLoading || isSolved) && "cursor-not-allowed opacity-60",
                  )}
                >
                  <Lightbulb
                    className={cn(
                      "h-3.5 w-3.5",
                      bottomLit ? "text-amber-400 fill-amber-400/70" : "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                </button>

                <span
                  className="mt-0.5 font-mono text-xs text-muted-foreground"
                  aria-hidden
                >
                  {switchNum}
                </span>
              </div>
            );
          })}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={solveSwitchesModule}
        onReset={resetAll}
        isSolveDisabled={isSolved}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {isForbiddenResult && result && (
        <SolverResult
          variant="warning"
          title="Invalid configuration"
          description={`${result.instruction} Reset the switches and try again.`}
        />
      )}

      {result && result.solved && !isForbiddenResult && (
        <>
          <SolverResult
            variant="success"
            title="Solved!"
            description={result.instruction ?? "Follow the flip sequence below."}
          />

          {solutionSteps.length > 0 && (
            <SolverSection
              title="Flip sequence"
              description={`Step ${currentStepIndex + 1} of ${solutionSteps.length}: flip switch ${solutionSteps[currentStepIndex]}.`}
            >
              <div className="flex flex-wrap gap-2">
                {solutionSteps.map((switchNum, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
                      idx === currentStepIndex
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : idx < currentStepIndex
                          ? "border-border bg-muted/40 text-muted-foreground line-through"
                          : "border-border bg-muted/40 text-muted-foreground",
                    )}
                  >
                    <span className="mr-1 tabular-nums">{idx + 1}.</span>
                    Switch {switchNum}
                  </span>
                ))}
              </div>

              {currentStepIndex < solutionSteps.length - 1 && (
                <div className="mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setCurrentStepIndex((i) => Math.min(i + 1, solutionSteps.length - 1))
                    }
                  >
                    Next step
                  </Button>
                </div>
              )}
            </SolverSection>
          )}
        </>
      )}

      {twitchCommand && result && !isForbiddenResult && (
        <TwitchCommandDisplay command={twitchCommand} />
      )}

      <SolverInstructions>
        Match the module: flip each switch up or down and click the lit LED for each
        position. Goal after solving: every switch points toward its lit LED. Keys 1–5
        flip switches.
      </SolverInstructions>
    </SolverLayout>
  );
}
