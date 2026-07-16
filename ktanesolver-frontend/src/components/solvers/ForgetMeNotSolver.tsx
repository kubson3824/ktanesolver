import { useCallback, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveForgetMeNot as solveForgetMeNotApi } from "../../services/forgetMeNotService";
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
  SolverResult,
} from "../common";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "../../lib/cn";

interface ForgetMeNotSolverProps {
  bomb: BombEntity | null | undefined;
}

interface Stage {
  display: number;
  calculated: number;
}

export default function ForgetMeNotSolver({ bomb }: ForgetMeNotSolverProps) {
  const [display, setDisplay] = useState<string>("");
  const [stage, setStage] = useState<number>(1);
  const [stages, setStages] = useState<Stage[]>([]);
  const [sequence, setSequence] = useState<number[]>([]);
  const [showSequence, setShowSequence] = useState<boolean>(false);
  const [groupSize, setGroupSize] = useState<number>(1);
  const [allModulesCompleted, setAllModulesCompleted] = useState<boolean>(false);
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
    () => ({
      display,
      stage,
      stages,
      sequence,
      showSequence,
      allModulesCompleted,
      twitchCommand,
    }),
    [display, stage, stages, sequence, showSequence, allModulesCompleted, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      display?: string;
      stage?: number;
      stages?: Stage[];
      sequence?: number[];
      showSequence?: boolean;
      allModulesCompleted?: boolean;
      twitchCommand?: string;
      displayNumbers?: number[];
      calculatedNumbers?: number[];
    }) => {
      if (state.display !== undefined) setDisplay(state.display);
      if (state.stage !== undefined) setStage(state.stage);
      if (state.showSequence !== undefined) setShowSequence(state.showSequence);
      if (state.allModulesCompleted !== undefined) setAllModulesCompleted(state.allModulesCompleted);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);

      if (state.stages && Array.isArray(state.stages)) {
        setStages(state.stages);
      }
      if (state.sequence && Array.isArray(state.sequence)) {
        setSequence(state.sequence);
      }

      if (
        (!state.stages || state.stages.length === 0) &&
        Array.isArray(state.displayNumbers) &&
        Array.isArray(state.calculatedNumbers) &&
        state.displayNumbers.length > 0
      ) {
        const calculatedNumbers = state.calculatedNumbers ?? [];
        const restoredStages: Stage[] = state.displayNumbers.map((d, index) => ({
          display: d,
          calculated: calculatedNumbers[index] ?? 0,
        }));
        setStages(restoredStages);
        setSequence(calculatedNumbers);
        setStage(state.displayNumbers.length + 1);
      }
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: { sequence: number[] } | number[]) => {
    const seq = Array.isArray(solution) ? solution : solution.sequence;
    if (!seq || !Array.isArray(seq) || seq.length === 0) return;
    setSequence(seq);
    setShowSequence(true);
    setAllModulesCompleted(true);
    setTwitchCommand(
      generateTwitchCommand({
        moduleType: ModuleType.FORGET_ME_NOT,
        result: { sequence: seq },
      }),
    );
  }, []);

  useSolverModulePersistence<
    {
      display: string;
      stage: number;
      stages: Stage[];
      sequence: number[];
      showSequence: boolean;
      allModulesCompleted: boolean;
      twitchCommand: string;
    },
    { sequence: number[] } | number[]
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; sequence?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object")
          return anyRaw.output as { sequence: number[] };
        if (Array.isArray(anyRaw.sequence)) return { sequence: anyRaw.sequence as number[] };
      }
      if (Array.isArray(raw)) return raw as number[];
      return null;
    },
    inferSolved: (_solution, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    onlyRestoreSolutionWhenSolved: true,
    currentModule,
    setIsSolved,
  });

  const handleSolve = async () => {
    const displayValue = parseInt(display);

    if (display === "" || isNaN(displayValue) || displayValue < 0 || displayValue > 9) {
      setError("Please enter a valid digit (0-9)");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveForgetMeNotApi(round.id, bomb.id, currentModule.id, {
        input: {
          display: displayValue,
          stage: stage,
          allModulesCompleted: allModulesCompleted,
        },
      });

      const newSequence = response.output.sequence;
      const newStage: Stage = {
        display: displayValue,
        calculated:
          stage === 1 ? newSequence[0] : stage > 1 ? newSequence[stage - 1] : 0,
      };

      setStages([...stages, newStage]);
      setSequence(newSequence);

      if (allModulesCompleted && displayValue === -1) {
        setShowSequence(true);
        setIsSolved(true);
        setTwitchCommand(
          generateTwitchCommand({
            moduleType: ModuleType.FORGET_ME_NOT,
            result: { sequence: newSequence },
          }),
        );

        if (bomb?.id && currentModule?.id) {
          markModuleSolved(bomb.id, currentModule.id);
        }
      } else {
        setStage(stage + 1);
        setDisplay("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Forget Me Not");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisplayChange = (value: string) => {
    if (value === "" || /^\d$/.test(value)) {
      setDisplay(value);
      if (error) clearError();
    }
  };

  const handleFinalSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveForgetMeNotApi(round.id, bomb.id, currentModule.id, {
        input: {
          display: -1,
          stage: stage,
          allModulesCompleted: true,
        },
      });

      const newSequence = response.output.sequence;
      setSequence(newSequence);
      setShowSequence(true);
      setIsSolved(true);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.FORGET_ME_NOT,
          result: { sequence: newSequence },
        }),
      );

      if (bomb?.id && currentModule?.id) {
        markModuleSolved(bomb.id, currentModule.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get final sequence");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAllModulesCompleted = async () => {
    setAllModulesCompleted(true);
    setDisplay("-1");
    await handleFinalSolve();
  };

  const reset = () => {
    setDisplay("");
    setStage(1);
    setStages([]);
    setSequence([]);
    setShowSequence(false);
    setGroupSize(1);
    setAllModulesCompleted(false);
    setTwitchCommand("");
    resetSolverState();
  };

  const disabled = isLoading || showSequence || isSolved;
  const useCompactSequence = sequence.length > 20;

  return (
    <SolverLayout>
      <SolverSection
        title="Stage display"
        description="Record each digit the Forget Me Not module shows. Advance between other modules and come back after each change."
      >
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Stage {stage}
          </span>
          <div className="rounded-md border border-border bg-muted/30 px-6 py-4">
            <Input
              type="text"
              value={display}
              onChange={(e) => handleDisplayChange(e.target.value)}
              placeholder="0"
              maxLength={1}
              disabled={disabled}
              aria-label={`Stage ${stage} digit`}
              className="h-auto w-24 border-0 bg-transparent text-center font-mono text-5xl font-bold text-emerald-600 focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-emerald-400"
            />
          </div>
        </div>
      </SolverSection>

      {stages.length > 0 && (
        <SolverSection
          title="Stage history"
          description={`${stages.length} stage${stages.length === 1 ? "" : "s"} recorded`}
        >
          <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-muted/20 p-2">
            <ul className="space-y-0.5">
              {stages.map((s, index) => (
                <li
                  key={index}
                  className="flex items-center justify-center gap-2 font-mono text-xs"
                >
                  <span className="w-6 text-right tabular-nums text-muted-foreground">
                    {index + 1}:
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {s.display}
                  </span>
                  <span className="text-muted-foreground" aria-hidden>
                    →
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {s.calculated}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </SolverSection>
      )}

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!display || isSolved}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText={allModulesCompleted ? "Get sequence" : "Record stage"}
        loadingText={allModulesCompleted ? "Getting sequence…" : "Recording…"}
      />

      {!allModulesCompleted && stages.length > 0 && !isSolved && (
        <Button
          variant="secondary"
          className="w-full"
          onClick={handleAllModulesCompleted}
          disabled={isLoading}
        >
          All other modules solved
        </Button>
      )}

      <ErrorAlert error={error} />

      {showSequence && sequence.length > 0 && (
        <>
          <SolverResult
            variant="success"
            title="Final sequence"
            description="Press the numbers on the module in this exact order."
          />
          <SolverSection title="Press order" className="border-emerald-500/40">
            <div className="mb-3 flex items-center justify-center gap-2">
              <label htmlFor="forget-me-not-group-size" className="text-sm text-muted-foreground">
                Group size
              </label>
              <Input
                id="forget-me-not-group-size"
                type="number"
                min={1}
                max={sequence.length}
                value={groupSize}
                onChange={(event) =>
                  setGroupSize(Math.min(sequence.length, Math.max(1, Number(event.target.value) || 1)))
                }
                className="h-8 w-16"
              />
            </div>
            <div className={cn("flex flex-wrap justify-center", groupSize === 1 ? "gap-1.5" : "gap-3")}>
              {Array.from({ length: Math.ceil(sequence.length / groupSize) }, (_, index) =>
                sequence.slice(index * groupSize, index * groupSize + groupSize),
              ).map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="flex max-w-full flex-wrap justify-center gap-1.5"
                  role="group"
                  aria-label={`Group ${groupIndex + 1}`}
                >
                  {group.map((num, index) => {
                    const sequenceIndex = groupIndex * groupSize + index;
                    return (
                      <div
                        key={sequenceIndex}
                        className={cn(
                          "inline-flex items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/15 font-mono font-bold text-emerald-700 dark:text-emerald-300",
                          useCompactSequence ? "h-8 w-8 text-sm" : "h-10 w-10 text-lg",
                        )}
                        aria-label={`Press ${sequenceIndex + 1}: ${num}`}
                      >
                        {num}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2
                className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
              {sequence.length} button{sequence.length === 1 ? "" : "s"} to press
            </p>
          </SolverSection>
        </>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Enter the digit the module shows each stage. Click "All other modules solved"
        once every other module on the bomb is disarmed to reveal the final sequence.
      </SolverInstructions>
    </SolverLayout>
  );
}
