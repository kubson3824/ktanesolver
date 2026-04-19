import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveMemory } from "../../services/memoryService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  SegmentedControl,
  StageIndicator,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverResult,
} from "../common";
import { cn } from "../../lib/cn";

interface MemorySolverProps {
  bomb: BombEntity | null | undefined;
}

interface StageResult {
  stage: number;
  display: number;
  position: number;
  label: number;
}

const NUMBER_OPTIONS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
] as const;

function MemoryMiniGrid({ position, label }: { position: number; label: number }) {
  return (
    <div className="flex h-8 w-24 shrink-0 gap-0.5" aria-hidden>
      {[1, 2, 3, 4].map((pos) => (
        <div
          key={pos}
          className={cn(
            "flex flex-1 items-center justify-center rounded border text-sm font-bold",
            pos === position
              ? "border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              : "border-border bg-muted text-muted-foreground",
          )}
        >
          {pos === position ? label : ""}
        </div>
      ))}
    </div>
  );
}

export default function MemorySolver({ bomb }: MemorySolverProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [buttonLabels, setButtonLabels] = useState<number[]>([1, 2, 3, 4]);
  const [stageHistory, setStageHistory] = useState<StageResult[]>([]);
  const [result, setResult] = useState<{ position: number; label: number } | null>(null);
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
    () => ({ currentStage, displayNumber, buttonLabels, stageHistory, result, twitchCommand }),
    [currentStage, displayNumber, buttonLabels, stageHistory, result, twitchCommand],
  );

  const displayTwitchCommands = useMemo(() => {
    const list = stageHistory.map((s) =>
      generateTwitchCommand({
        moduleType: ModuleType.MEMORY,
        result: { position: s.position, label: s.label },
      }),
    );
    if (result && twitchCommand) list.push(twitchCommand);
    return list;
  }, [stageHistory, result, twitchCommand]);

  const onRestoreState = useCallback(
    (state: {
      currentStage?: number;
      displayNumber?: number | null;
      buttonLabels?: number[];
      stageHistory?: StageResult[];
      result?: { position: number; label: number } | null;
      twitchCommand?: string;
      displayHistory?: number[];
      solutionHistory?: { position: number; label: number }[];
    }) => {
      const raw = state as Record<string, unknown>;
      const hasBackendShape =
        Array.isArray(raw.displayHistory) && Array.isArray(raw.solutionHistory);

      if (hasBackendShape) {
        const displayHistory = raw.displayHistory as number[];
        const solutionHistory = raw.solutionHistory as { position: number; label: number }[];
        const stage = Math.min((displayHistory.length || 0) + 1, 5);
        setCurrentStage(stage);
        setStageHistory(
          solutionHistory.map((step, i) => ({
            stage: i + 1,
            display: displayHistory[i] ?? 0,
            position: step.position,
            label: step.label,
          })),
        );
        setDisplayNumber(null);
        setResult(null);
        setTwitchCommand("");
        if (state.buttonLabels && state.buttonLabels.length === 4)
          setButtonLabels(state.buttonLabels);
      } else {
        if (state.currentStage !== undefined) setCurrentStage(Math.min(state.currentStage, 5));
        if (state.displayNumber !== undefined) setDisplayNumber(state.displayNumber);
        if (state.buttonLabels) setButtonLabels(state.buttonLabels);
        if (state.stageHistory) setStageHistory(state.stageHistory);
        if (state.result !== undefined) setResult(state.result);
        if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
      }
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: { position: number; label: number }) => {
      if (!solution) return;
      setResult(solution);
      setCurrentStage(5);
    },
    [],
  );

  useSolverModulePersistence<
    {
      currentStage: number;
      displayNumber: number | null;
      buttonLabels: number[];
      stageHistory: StageResult[];
      result: { position: number; label: number } | null;
      twitchCommand: string;
    },
    { position: number; label: number }
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as {
          output?: unknown;
          finalResult?: unknown;
          position?: number;
          label?: number;
        };
        if (anyRaw.output && typeof anyRaw.output === "object")
          return anyRaw.output as { position: number; label: number };
        if (anyRaw.finalResult && typeof anyRaw.finalResult === "object")
          return anyRaw.finalResult as { position: number; label: number };
        if (typeof anyRaw.position === "number" && typeof anyRaw.label === "number")
          return { position: anyRaw.position, label: anyRaw.label };
      }
      return null;
    },
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleLabelChange = (position: number, label: number) => {
    if (isSolved) return;
    const next = [...buttonLabels];
    next[position] = label;
    setButtonLabels(next);
  };

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }
    if (displayNumber === null || displayNumber < 1 || displayNumber > 4) {
      setError("Pick the number currently shown on the display (1–4).");
      return;
    }
    if (buttonLabels.some((l) => l < 1 || l > 4)) {
      setError("All button labels must be between 1 and 4.");
      return;
    }
    if (currentStage > 5) {
      setError("Memory has only 5 stages. Reset to start over.");
      return;
    }

    setIsLoading(true);
    clearError();
    try {
      const response = await solveMemory(round.id, bomb.id, currentModule.id, {
        input: { stage: currentStage, display: displayNumber, labels: buttonLabels },
      });

      setResult(response.output);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.MEMORY,
          result: response.output,
        }),
      );

      const stageResult: StageResult = {
        stage: currentStage,
        display: displayNumber,
        position: response.output.position,
        label: response.output.label,
      };
      const newHistory = [...stageHistory, stageResult];
      setStageHistory(newHistory);

      if (response.solved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        setDisplayNumber(null);
      } else {
        setCurrentStage(Math.min(currentStage + 1, 5));
        setDisplayNumber(null);
        setResult(null);
        setTwitchCommand("");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to solve memory module";
      if (msg.includes("Invalid stage order")) {
        setError("Module state is out of sync — reset and start from stage 1.");
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setCurrentStage(1);
    setDisplayNumber(null);
    setButtonLabels([1, 2, 3, 4]);
    setStageHistory([]);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const highlightedPosition = result?.position;

  return (
    <SolverLayout>
      <SolverSection title="Stage progress">
        <StageIndicator total={5} current={currentStage} completedThrough={stageHistory.length} />
      </SolverSection>

      <SolverSection
        title="Display number"
        description="The large number shown on the module's display."
      >
        <SegmentedControl
          value={displayNumber ?? 0}
          onChange={(v) => !isSolved && setDisplayNumber(v as number)}
          options={NUMBER_OPTIONS}
          ariaLabel="Display number"
          disabled={isSolved}
          className="w-full justify-center"
        />
      </SolverSection>

      <SolverSection
        title="Button labels"
        description="Set the number printed on each of the four buttons, in order."
      >
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((position) => {
            const label = buttonLabels[position];
            const isHighlighted = highlightedPosition === position + 1;
            return (
              <div key={position} className="flex flex-col items-center gap-1.5">
                <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Pos {position + 1}
                </div>
                <div
                  className={cn(
                    "flex aspect-square w-full items-center justify-center rounded-xl border-2 text-2xl font-bold transition-all",
                    isHighlighted
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shadow-md"
                      : "border-border bg-muted/60 text-foreground",
                  )}
                >
                  {label}
                </div>
                <SegmentedControl
                  value={label}
                  onChange={(v) => handleLabelChange(position, v as number)}
                  options={NUMBER_OPTIONS}
                  size="sm"
                  ariaLabel={`Position ${position + 1} label`}
                  disabled={isSolved}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={displayNumber === null}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText={
          isSolved
            ? "Module Solved"
            : currentStage === 5
              ? "Final stage"
              : `Solve stage ${currentStage}`
        }
      />

      <ErrorAlert error={error} />

      {stageHistory.length > 0 && (
        <SolverSection title="Stage history">
          <ul className="space-y-2 text-sm">
            {stageHistory.map((stage, index) => (
              <li
                key={index}
                className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2"
              >
                <span className="shrink-0 font-semibold">Stage {stage.stage}</span>
                <span className="shrink-0 text-muted-foreground">
                  Display <strong className="text-foreground">{stage.display}</strong>
                </span>
                <MemoryMiniGrid position={stage.position} label={stage.label} />
                <span className="shrink-0 text-muted-foreground">
                  Position <strong className="text-foreground">{stage.position}</strong>, label{" "}
                  <strong className="text-foreground">{stage.label}</strong>
                </span>
              </li>
            ))}
          </ul>
        </SolverSection>
      )}

      {result && !isSolved && (
        <SolverResult
          variant="success"
          title="Press this button"
          description={`Position ${result.position}, label ${result.label}`}
        />
      )}

      {displayTwitchCommands.length > 0 && (
        <TwitchCommandDisplay command={displayTwitchCommands} />
      )}

      <SolverInstructions>
        Memory has 5 stages. At each stage, the display shows a number and the
        four buttons have numeric labels. The solver tracks what was pressed to
        produce the correct answer for the next stage.
      </SolverInstructions>
    </SolverLayout>
  );
}
