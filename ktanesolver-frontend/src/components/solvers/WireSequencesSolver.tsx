import { useCallback, useMemo, useState } from "react";
import { Scissors, X } from "lucide-react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import {
  solveWireSequences,
  type WireSequenceCombo,
  type WireColor,
  type WireSequencesSolveRequest,
} from "../../services/wireSequencesService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SegmentedControl,
  StageIndicator,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls,
} from "../common";
import { useRoundStore } from "../../store/useRoundStore";
import { cn } from "../../lib/cn";

interface WireSequencesSolverProps {
  bomb: BombEntity | null | undefined;
}

interface ColorSpec {
  color: WireColor;
  label: string;
  swatch: string;
  wire: string;
}

const COLORS: readonly ColorSpec[] = [
  {
    color: "RED",
    label: "Red",
    swatch: "bg-red-500",
    wire: "bg-gradient-to-r from-red-600 to-red-500",
  },
  {
    color: "BLUE",
    label: "Blue",
    swatch: "bg-blue-500",
    wire: "bg-gradient-to-r from-blue-600 to-blue-500",
  },
  {
    color: "BLACK",
    label: "Black",
    swatch: "bg-neutral-900 border border-neutral-500",
    wire: "bg-gradient-to-r from-neutral-900 to-neutral-700",
  },
] as const;

const LETTER_OPTIONS = [
  { value: "A" as const, label: "A" },
  { value: "B" as const, label: "B" },
  { value: "C" as const, label: "C" },
] as const;

function colorSpec(c: WireColor): ColorSpec {
  return COLORS.find((s) => s.color === c) ?? COLORS[0];
}

export default function WireSequencesSolver({ bomb }: WireSequencesSolverProps) {
  const [wires, setWires] = useState<WireSequenceCombo[]>([]);
  const [pendingColor, setPendingColor] = useState<WireColor>("RED");
  const [pendingLetter, setPendingLetter] = useState<"A" | "B" | "C">("A");
  const [currentStage, setCurrentStage] = useState(1);
  const [solution, setSolution] = useState<boolean[]>([]);
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);
  const [moduleState, setModuleState] = useState({
    redCount: 0,
    blueCount: 0,
    blackCount: 0,
  });
  const [stageSolved, setStageSolved] = useState(false);

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

  const persistedState = useMemo(
    () => ({ wires, currentStage, solution, twitchCommands, moduleState, stageSolved }),
    [wires, currentStage, solution, twitchCommands, moduleState, stageSolved],
  );

  const onRestoreState = useCallback(
    (state: {
      wires?: WireSequenceCombo[];
      currentStage?: number;
      solution?: boolean[];
      twitchCommands?: string[];
      moduleState?: { redCount: number; blueCount: number; blackCount: number };
      stageSolved?: boolean;
      red?: number;
      blue?: number;
      black?: number;
      history?: WireSequenceCombo[];
    }) => {
      if (state.wires && Array.isArray(state.wires)) setWires(state.wires);
      if (state.currentStage !== undefined) setCurrentStage(state.currentStage);
      if (state.solution && Array.isArray(state.solution)) setSolution(state.solution);
      if (state.twitchCommands && Array.isArray(state.twitchCommands))
        setTwitchCommands(state.twitchCommands);
      if (state.stageSolved !== undefined) setStageSolved(state.stageSolved);
      if (state.moduleState && typeof state.moduleState === "object") {
        setModuleState(state.moduleState);
      } else if (
        typeof state.red === "number" &&
        typeof state.blue === "number" &&
        typeof state.black === "number"
      ) {
        setModuleState({
          redCount: state.red,
          blueCount: state.blue,
          blackCount: state.black,
        });
      }
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (
      restored: {
        cut?: boolean[];
        finalStage?: number;
        moduleState?: { redCount: number; blueCount: number; blackCount: number };
      } | null,
    ) => {
      if (restored?.cut && Array.isArray(restored.cut)) setSolution(restored.cut);
      if (restored?.finalStage !== undefined) setCurrentStage(restored.finalStage);
      if (restored?.moduleState && typeof restored.moduleState === "object")
        setModuleState(restored.moduleState);
    },
    [],
  );

  useSolverModulePersistence<
    {
      wires: WireSequenceCombo[];
      currentStage: number;
      solution: boolean[];
      twitchCommands: string[];
      moduleState: { redCount: number; blueCount: number; blackCount: number };
      stageSolved: boolean;
    },
    {
      cut?: boolean[];
      finalStage?: number;
      moduleState?: { redCount: number; blueCount: number; blackCount: number };
    }
  >({
    state: persistedState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw !== "object") return null;
      const anyRaw = raw as {
        cut?: boolean[];
        output?: { cut?: boolean[]; finalStage?: number; moduleState?: unknown };
        finalStage?: number;
        moduleState?: { redCount: number; blueCount: number; blackCount: number };
      };
      const cut = Array.isArray(anyRaw.cut)
        ? anyRaw.cut
        : Array.isArray(anyRaw.output?.cut)
          ? anyRaw.output.cut
          : undefined;
      const finalStage =
        typeof anyRaw.finalStage === "number"
          ? anyRaw.finalStage
          : typeof anyRaw.output?.finalStage === "number"
            ? anyRaw.output.finalStage
            : undefined;
      const moduleState =
        typeof anyRaw.moduleState === "object" && anyRaw.moduleState != null
          ? (anyRaw.moduleState as { redCount: number; blueCount: number; blackCount: number })
          : typeof anyRaw.output?.moduleState === "object" && anyRaw.output?.moduleState != null
            ? (anyRaw.output.moduleState as { redCount: number; blueCount: number; blackCount: number })
            : undefined;
      if (cut != null || finalStage != null || moduleState != null) {
        return { cut, finalStage, moduleState };
      }
      return null;
    },
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const addWire = () => {
    if (wires.length >= 3) {
      setError("Maximum 3 wires per stage");
      return;
    }
    setWires([...wires, { color: pendingColor, letter: pendingLetter }]);
    clearError();
    setSolution([]);
    setTwitchCommands([]);
  };

  const removeWire = (index: number) => {
    setWires(wires.filter((_, i) => i !== index));
    clearError();
    setSolution([]);
    setTwitchCommands([]);
  };

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    if (wires.length === 0) {
      setError("At least 1 wire is required to solve a stage");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const request: WireSequencesSolveRequest = {
        input: {
          wires,
          stage: currentStage,
        },
      };

      const response = await solveWireSequences(round.id, bomb.id, currentModule.id, request);

      const cutResult = response.output.cut;
      setSolution(cutResult);

      const newRedCount = moduleState.redCount + wires.filter((w) => w.color === "RED").length;
      const newBlueCount = moduleState.blueCount + wires.filter((w) => w.color === "BLUE").length;
      const newBlackCount = moduleState.blackCount + wires.filter((w) => w.color === "BLACK").length;
      const newModuleState = {
        redCount: newRedCount,
        blueCount: newBlueCount,
        blackCount: newBlackCount,
      };
      setModuleState(newModuleState);

      const commands: string[] = [];
      cutResult.forEach((shouldCut, index) => {
        if (shouldCut && index < wires.length) {
          const command = generateTwitchCommand({
            moduleType: ModuleType.WIRE_SEQUENCES,
            result: {
              action: "cut",
              wire: wires[index],
              wirePosition: index + 1,
              stage: currentStage,
            },
          });
          commands.push(command);
        }
      });
      setTwitchCommands(commands);

      if (response.solved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
      } else {
        setStageSolved(true);
      }

      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        {
          wires,
          currentStage,
          solution: cutResult,
          twitchCommands: commands,
          moduleState: newModuleState,
          stageSolved: !response.solved,
        },
        { cut: cutResult },
        response.solved,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Wire Sequences");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setWires([]);
    setCurrentStage(1);
    setSolution([]);
    setTwitchCommands([]);
    setModuleState({ redCount: 0, blueCount: 0, blackCount: 0 });
    setStageSolved(false);
    resetSolverState();
  };

  const nextStage = () => {
    const nextStageNum = currentStage + 1;
    setCurrentStage(nextStageNum);
    setWires([]);
    setSolution([]);
    clearError();
    setTwitchCommands([]);
    setStageSolved(false);
    if (round?.id && bomb?.id && currentModule?.id) {
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        {
          wires: [],
          currentStage: nextStageNum,
          solution: [],
          twitchCommands: [],
          moduleState,
          stageSolved: false,
        },
        {},
        false,
      );
    }
  };

  const solveButtonLabel = isSolved
    ? "Module solved"
    : stageSolved && !isSolved
      ? currentStage === 4
        ? "Module complete"
        : `Next stage (${currentStage + 1}/4)`
      : currentStage === 4
        ? "Final stage"
        : `Solve stage ${currentStage}`;

  const handlePrimaryAction = stageSolved && !isSolved ? nextStage : handleSolve;
  const isPrimaryDisabled =
    isLoading || isSolved || (!stageSolved && !isSolved && wires.length === 0);

  const completedThrough = isSolved ? 4 : stageSolved ? currentStage : currentStage - 1;

  return (
    <SolverLayout>
      <SolverSection
        title="Wire Sequences"
        description="Four stages. Enter the wires visible on the current page, solve, then advance."
      >
        <StageIndicator total={4} current={currentStage} completedThrough={completedThrough} />

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs">
            <span aria-hidden className="h-2 w-2 rounded-full bg-red-500" />
            <span className="font-mono tabular-nums">{moduleState.redCount}</span>
            <span className="text-muted-foreground">red</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs">
            <span aria-hidden className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="font-mono tabular-nums">{moduleState.blueCount}</span>
            <span className="text-muted-foreground">blue</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs">
            <span aria-hidden className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-neutral-100" />
            <span className="font-mono tabular-nums">{moduleState.blackCount}</span>
            <span className="text-muted-foreground">black</span>
          </span>
        </div>
      </SolverSection>

      {!isSolved && !stageSolved && (
        <SolverSection
          title="Add wire"
          description={`Pick color and target letter, then add (${wires.length}/3).`}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Color
              </span>
              <div className="flex items-center gap-2">
                {COLORS.map((c) => {
                  const selected = pendingColor === c.color;
                  return (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setPendingColor(c.color)}
                      disabled={isLoading}
                      aria-pressed={selected}
                      aria-label={`Pick ${c.label}`}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-md border px-2.5 h-8 text-xs font-medium transition-colors",
                        selected
                          ? "border-ring ring-2 ring-ring ring-offset-1 ring-offset-card bg-accent/15 text-foreground"
                          : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className={cn("h-3 w-3 rounded-full", c.swatch)} aria-hidden />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Target letter
              </span>
              <SegmentedControl
                value={pendingLetter}
                onChange={(v) => setPendingLetter(v as "A" | "B" | "C")}
                options={LETTER_OPTIONS}
                size="sm"
                ariaLabel="Target letter"
                disabled={isLoading}
              />
            </div>

            <button
              type="button"
              onClick={addWire}
              disabled={isLoading || wires.length >= 3}
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-md border border-border bg-accent/15 px-3 text-sm font-medium text-foreground transition-colors",
                "hover:bg-accent/25",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              Add wire → {colorSpec(pendingColor).label} to {pendingLetter}
            </button>
          </div>
        </SolverSection>
      )}

      <SolverSection
        title={isSolved ? "All wires" : `Stage ${currentStage} wires`}
        description={
          wires.length === 0 && !isSolved
            ? "Add 1–3 wires above, then solve this stage."
            : undefined
        }
      >
        {wires.length === 0 && !isSolved ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No wires yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {wires.map((wire, index) => {
              const spec = colorSpec(wire.color);
              const shouldCut = solution[index];
              const isCut = shouldCut === true;
              return (
                <li
                  key={index}
                  className={cn(
                    "rounded-lg border border-border bg-muted/40 p-3 transition-colors",
                    isCut && "border-emerald-500 bg-emerald-500/10",
                    shouldCut === false && solution.length > 0 && "opacity-80",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Wire #{index + 1}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {spec.label} → {wire.letter}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-3 w-3 shrink-0 rounded-full bg-muted-foreground/30 ring-2 ring-muted-foreground/20"
                    />
                    <div
                      className={cn(
                        "relative flex h-7 flex-1 items-center justify-center rounded-full text-sm font-semibold text-white",
                        spec.wire,
                      )}
                    >
                      {wire.letter}
                      {isCut && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            <Scissors className="h-3 w-3" aria-hidden />
                            CUT
                          </span>
                        </span>
                      )}
                    </div>
                    <span
                      aria-hidden
                      className="h-3 w-3 shrink-0 rounded-full bg-muted-foreground/30 ring-2 ring-muted-foreground/20"
                    />
                    {!isSolved && !stageSolved && (
                      <button
                        type="button"
                        onClick={() => removeWire(index)}
                        disabled={isLoading}
                        aria-label={`Remove wire ${index + 1}`}
                        className={cn(
                          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors",
                          "hover:text-red-600 hover:border-red-400",
                          "disabled:opacity-40 disabled:cursor-not-allowed",
                        )}
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    )}
                  </div>

                  {shouldCut !== undefined && (
                    <div className="mt-2 text-xs font-medium">
                      <span
                        className={cn(
                          shouldCut
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-muted-foreground",
                        )}
                      >
                        {shouldCut ? "Cut this wire" : "Leave this wire"}
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </SolverSection>

      <SolverControls
        onSolve={handlePrimaryAction}
        onReset={reset}
        isSolveDisabled={isPrimaryDisabled}
        isResetDisabled={isLoading}
        isLoading={isLoading}
        solveText={solveButtonLabel}
        loadingText="Solving..."
      />

      <ErrorAlert error={error} />

      {twitchCommands.length > 0 && <TwitchCommandDisplay command={twitchCommands} />}

      <SolverInstructions>
        Wire Sequences has 4 pages. For each page, add 1–3 wires (color + target letter A/B/C),
        solve to see cut/leave instructions, then advance. Counts persist across stages.
      </SolverInstructions>
    </SolverLayout>
  );
}
