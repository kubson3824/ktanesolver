import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveSwitches, type SwitchesInput, type SwitchesOutput } from "../../services/switchesService";
import SolverLayout from "../common/SolverLayout";
import SolverControls from "../common/SolverControls";
import ErrorAlert from "../common/ErrorAlert";
import TwitchCommandDisplay from "../common/TwitchCommandDisplay";
import SolverResult from "../common/SolverResult";
import { useSolver, useSolverModulePersistence } from "../common";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcut";

interface SwitchesSolverProps {
  bomb: BombEntity | null | undefined;
}

const FORBIDDEN_MESSAGE = "Current switch configuration is invalid";

export default function SwitchesSolver({ bomb }: SwitchesSolverProps) {
  const [currentSwitches, setCurrentSwitches] = useState<boolean[]>([false, false, false, false, false]);
  const [ledPositions, setLedPositions] = useState<boolean[]>([false, false, false, false, false]);
  const [result, setResult] = useState<SwitchesOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentModule = useRoundStore((state) => state.currentModule);

  const { isLoading, error, isSolved, clearError, reset, setIsLoading, setError, setIsSolved, round, markModuleSolved } = useSolver();

  const moduleState = useMemo(
    () => ({ currentSwitches, ledPositions, result, twitchCommand }),
    [currentSwitches, ledPositions, result, twitchCommand],
  );

  const defaultSwitches = useMemo(() => [false, false, false, false, false] as boolean[], []);

  const onRestoreState = useCallback(
    (state: { currentSwitches?: boolean[]; ledPositions?: boolean[]; result?: SwitchesOutput | null; twitchCommand?: string }) => {
      const switches = Array.isArray(state.currentSwitches) && state.currentSwitches.length === 5
        ? state.currentSwitches
        : defaultSwitches;
      const leds = Array.isArray(state.ledPositions) && state.ledPositions.length === 5
        ? state.ledPositions
        : defaultSwitches;
      setCurrentSwitches(switches);
      setLedPositions(leds);
      setResult(state.result ?? null);
      setTwitchCommand(typeof state.twitchCommand === "string" ? state.twitchCommand : "");
    },
    [defaultSwitches],
  );

  const onRestoreSolution = useCallback(
    (solution: SwitchesOutput) => {
      if (solution.instruction) {
        setResult(solution);
        setCurrentStepIndex(0);
        const command = generateTwitchCommand({
          moduleType: ModuleType.SWITCHES,
          result: { instruction: solution.instruction },
        });
        setTwitchCommand(command);
      }
    },
    [],
  );

  useSolverModulePersistence<
    { currentSwitches: boolean[]; ledPositions: boolean[]; result: SwitchesOutput | null; twitchCommand: string },
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

  const isForbiddenResult = result && !result.solved && result.instruction?.includes(FORBIDDEN_MESSAGE);
  const solutionSteps = Array.isArray(result?.solutionSteps) ? result.solutionSteps : [];
  const currentStepSwitch = solutionSteps.length
    ? solutionSteps[Math.min(currentStepIndex, solutionSteps.length - 1)]
    : null;

  return (
    <SolverLayout>
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-base-content">Module state</CardTitle>
          <CardDescription>Set each switch and which LED is lit. Click an LED dot to set it as lit for that switch.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-base-300 bg-base-300/50 p-6">
            <div className="grid grid-cols-5 gap-4">
              {(currentSwitches ?? defaultSwitches).map((isUp, index) => {
                const switchNum = index + 1;
                const isCurrentStep = currentStepSwitch === switchNum;
                return (
                  <div key={index} className="flex flex-col items-center">
                    {/* Top LED - click to set lit at top */}
                    <button
                      type="button"
                      onClick={() => setLedLitTop(index)}
                      disabled={isLoading || isSolved}
                      aria-label={`Switch ${switchNum}, LED top, ${(ledPositions ?? defaultSwitches)[index] ? "lit" : "unlit"}`}
                      className={`mb-2 h-4 w-4 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 disabled:pointer-events-none disabled:opacity-50 ${
                        (ledPositions ?? defaultSwitches)[index]
                          ? "border-success/50 bg-success shadow-[0_0_8px_rgba(91,231,169,0.5)]"
                          : "border-base-400 bg-base-300"
                      } ${!(isLoading || isSolved) ? "hover:opacity-90" : ""}`}
                    />

                    {/* Switch - click to flip */}
                    <button
                      type="button"
                      onClick={() => toggleSwitch(index)}
                      disabled={isLoading || isSolved}
                      aria-label={`Switch ${switchNum}, ${isUp ? "up" : "down"}`}
                      className={`relative w-12 h-20 rounded-lg border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 disabled:pointer-events-none disabled:opacity-50 ${
                        isCurrentStep ? "ring-2 ring-primary ring-offset-2 ring-offset-base-300 animate-pulse-success" : ""
                      } ${
                        isUp
                          ? "border-base-400 bg-base-200"
                          : "border-base-400 bg-base-300"
                      } ${!(isLoading || isSolved) ? "hover:scale-[1.02]" : ""}`}
                    >
                      <div
                        className={`absolute left-1/2 w-8 h-8 -translate-x-1/2 rounded bg-neutral transition-all duration-200 ${
                          isUp ? "top-1" : "bottom-1"
                        }`}
                        aria-hidden
                      />
                    </button>

                    {/* Bottom LED - click to set lit at bottom */}
                    <button
                      type="button"
                      onClick={() => setLedLitBottom(index)}
                      disabled={isLoading || isSolved}
                      aria-label={`Switch ${switchNum}, LED bottom, ${!(ledPositions ?? defaultSwitches)[index] ? "lit" : "unlit"}`}
                      className={`mt-2 h-4 w-4 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 disabled:pointer-events-none disabled:opacity-50 ${
                        !(ledPositions ?? defaultSwitches)[index]
                          ? "border-success/50 bg-success shadow-[0_0_8px_rgba(91,231,169,0.5)]"
                          : "border-base-400 bg-base-300"
                      } ${!(isLoading || isSolved) ? "hover:opacity-90" : ""}`}
                    />

                    <span className="mt-2 text-xs text-base-content/60" aria-hidden>
                      {switchNum}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <SolverControls
        onSolve={solveSwitchesModule}
        onReset={resetAll}
        isSolveDisabled={isSolved}
        isLoading={isLoading}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {/* Result: forbidden state */}
      {isForbiddenResult && (
        <SolverResult
          variant="warning"
          title="Invalid configuration"
          description={`${result.instruction} Reset the switches and try again.`}
        />
      )}

      {/* Result: solved */}
      {result && result.solved && !isForbiddenResult && (
        <>
          <SolverResult variant="success" title="Solved!" description={result.instruction} />
          {solutionSteps.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-sm font-medium text-base-content/90">
                Step {currentStepIndex + 1} of {solutionSteps.length}: Flip switch {solutionSteps[currentStepIndex]}
              </p>
              <div className="flex flex-wrap gap-2">
                {solutionSteps.map((switchNum, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                      idx === currentStepIndex
                        ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                        : "bg-base-300 text-base-content/80"
                    }`}
                  >
                    {idx + 1} → Switch {switchNum}
                  </span>
                ))}
              </div>
              {currentStepIndex < solutionSteps.length - 1 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentStepIndex((i) => Math.min(i + 1, solutionSteps.length - 1))}
                >
                  Next step
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {twitchCommand && result && !isForbiddenResult && (
        <TwitchCommandDisplay command={twitchCommand} />
      )}

      <Card className="mt-4">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium text-base-content/80">How to use</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription>
            Match the module: set each switch and which LED is lit (top or bottom). Goal: each switch points toward its lit LED. Then press Solve. You can also use keys 1–5 to flip switches.
          </CardDescription>
        </CardContent>
      </Card>
    </SolverLayout>
  );
}
