import { useCallback, useMemo, useState } from "react";
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
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls,
} from "../common";
import { useRoundStore } from "../../store/useRoundStore";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/cn";

interface WireSequencesSolverProps {
  bomb: BombEntity | null | undefined;
}

const WIRE_COLORS: { color: WireColor; display: string; className: string }[] = [
  { color: "RED", display: "Red", className: "bg-red-500" },
  { color: "BLUE", display: "Blue", className: "bg-blue-500" },
  { color: "BLACK", display: "Black", className: "bg-gray-900" },
];

const LETTERS: { letter: "A" | "B" | "C"; display: string }[] = [
  { letter: "A", display: "A" },
  { letter: "B", display: "B" },
  { letter: "C", display: "C" },
];

export default function WireSequencesSolver({ bomb }: WireSequencesSolverProps) {
  const [wires, setWires] = useState<WireSequenceCombo[]>([]);
  const [currentStage, setCurrentStage] = useState(1);
  const [solution, setSolution] = useState<boolean[]>([]);
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);
  const [moduleState, setModuleState] = useState({
    redCount: 0,
    blueCount: 0,
    blackCount: 0,
  });
  const [stageSolved, setStageSolved] = useState(false);

  // Use the common solver hook for shared state
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
      if (state.twitchCommands && Array.isArray(state.twitchCommands)) setTwitchCommands(state.twitchCommands);
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
    (restored: {
      cut?: boolean[];
      finalStage?: number;
      moduleState?: { redCount: number; blueCount: number; blackCount: number };
    } | null) => {
      if (restored?.cut && Array.isArray(restored.cut)) setSolution(restored.cut);
      if (restored?.finalStage !== undefined) setCurrentStage(restored.finalStage);
      if (restored?.moduleState && typeof restored.moduleState === "object") setModuleState(restored.moduleState);
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
    { cut?: boolean[]; finalStage?: number; moduleState?: { redCount: number; blueCount: number; blackCount: number } }
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
      const cut = Array.isArray(anyRaw.cut) ? anyRaw.cut : Array.isArray(anyRaw.output?.cut) ? anyRaw.output.cut : undefined;
      const finalStage = typeof anyRaw.finalStage === "number" ? anyRaw.finalStage : typeof anyRaw.output?.finalStage === "number" ? anyRaw.output.finalStage : undefined;
      const moduleState = typeof anyRaw.moduleState === "object" && anyRaw.moduleState != null
        ? (anyRaw.moduleState as { redCount: number; blueCount: number; blackCount: number })
        : typeof anyRaw.output?.moduleState === "object" && anyRaw.output?.moduleState != null
          ? (anyRaw.output.moduleState as { redCount: number; blueCount: number; blackCount: number })
          : undefined;
      if (cut != null || finalStage != null || moduleState != null) {
        return { cut, finalStage, moduleState };
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const addWire = (color: WireColor, letter: "A" | "B" | "C") => {
    if (wires.length >= 3) {
      setError("Maximum 3 wires per stage");
      return;
    }
    const newWire: WireSequenceCombo = { color, letter };
    setWires([...wires, newWire]);
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
        }
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
        response.solved
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
    setModuleState({
      redCount: 0,
      blueCount: 0,
      blackCount: 0,
    });
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
        false
      );
    }
  };

  const solveButtonLabel = isSolved
    ? "Module Solved"
    : stageSolved && !isSolved
      ? currentStage === 4
        ? "Module Complete"
        : `Next Stage (${currentStage + 1}/4)`
      : currentStage === 4
        ? "Final Stage"
        : `Solve Stage ${currentStage}`;

  const handlePrimaryAction = stageSolved && !isSolved ? nextStage : handleSolve;
  const isPrimaryDisabled =
    isLoading ||
    isSolved ||
    (!stageSolved && !isSolved && wires.length === 0);

  return (
    <SolverLayout>
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-lg">Wire Sequences</CardTitle>
          {/* Stage indicator: 4 pills */}
          <div
            className="flex justify-center gap-2 mt-3"
            role="tablist"
            aria-label="Stage progress"
          >
            {[1, 2, 3, 4].map((stage) => (
              <div
                key={stage}
                role="tab"
                aria-current={currentStage === stage ? "step" : undefined}
                aria-label={`Stage ${stage}`}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  currentStage === stage
                    ? "border-primary bg-primary text-primary-content"
                    : "border-base-300 bg-base-200 text-base-content/70"
                )}
              >
                {stage}
              </div>
            ))}
          </div>
          {/* Wire counters as Badges */}
          <div className="flex justify-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden />
              <span>{moduleState.redCount}</span>
            </Badge>
            <Badge variant="outline" className="gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" aria-hidden />
              <span>{moduleState.blueCount}</span>
            </Badge>
            <Badge variant="outline" className="gap-1">
              <span className="w-2 h-2 rounded-full bg-base-content/80" aria-hidden />
              <span>{moduleState.blackCount}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Add wire input */}
          {!isSolved && !stageSolved && (
            <section aria-labelledby="add-wires-heading">
              <h4
                id="add-wires-heading"
                className="text-sm font-medium text-base-content/80 mb-2 flex items-center gap-2"
              >
                Add wires
                <Badge variant="secondary" className="font-mono">
                  {wires.length}/3
                </Badge>
              </h4>
              <p className="text-xs text-base-content/60 mb-2">
                Pick color, then letter (A, B, or C).
              </p>
              <div className="space-y-2">
                {WIRE_COLORS.map((color) => (
                  <div
                    key={color.color}
                    className="flex gap-2 items-center flex-wrap"
                  >
                    <div
                      className={cn("w-5 h-5 rounded shrink-0", color.className)}
                      aria-hidden
                    />
                    <span className="text-sm w-12 shrink-0">{color.display}</span>
                    {LETTERS.map((letter) => (
                      <button
                        key={`${color.color}-${letter.letter}`}
                        onClick={() => addWire(color.color, letter.letter)}
                        className="btn btn-xs btn-outline"
                        disabled={isLoading || wires.length >= 3}
                        aria-label={`Add wire ${color.display} ${letter.letter}`}
                      >
                        {letter.display}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Current wires – wire-strip metaphor */}
          <section aria-labelledby="current-wires-heading">
            <h4
              id="current-wires-heading"
              className="text-sm font-medium text-base-content/80 mb-2"
            >
              {isSolved ? "All wires" : `Stage ${currentStage} wires`}
            </h4>
            {wires.length === 0 && !isSolved ? (
              <p className="text-sm text-base-content/60 text-center py-2">
                Add 1–3 wires, then solve this stage.
              </p>
            ) : (
              <div className="space-y-3">
                {wires.map((wire, index) => {
                  const wireColorClass =
                    wire.color === "RED"
                      ? "bg-red-500"
                      : wire.color === "BLUE"
                        ? "bg-blue-500"
                        : "bg-base-content/90";
                  const shouldCut = solution[index];
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-2",
                        shouldCut === true && "ring-2 ring-success rounded-lg ring-offset-2 ring-offset-base-100",
                        shouldCut === false && solution.length > 0 && "opacity-75"
                      )}
                    >
                      <div
                        className="w-3 h-3 rounded-full border-2 border-base-300 bg-base-300 shrink-0"
                        aria-hidden
                      />
                      <div
                        className={cn(
                          "flex-1 h-8 rounded flex items-center justify-center font-semibold text-sm min-w-0",
                          wireColorClass,
                          wire.color === "BLACK" || wire.color === "RED" || wire.color === "BLUE"
                            ? "text-white"
                            : "text-base-100"
                        )}
                      >
                        {wire.letter}
                      </div>
                      <div
                        className="w-3 h-3 rounded-full border-2 border-base-300 bg-base-300 shrink-0"
                        aria-hidden
                      />
                      {!isSolved && (
                        <button
                          type="button"
                          onClick={() => removeWire(index)}
                          className="btn btn-xs btn-ghost btn-error shrink-0"
                          disabled={isLoading}
                          aria-label={`Remove wire ${index + 1}`}
                        >
                          ×
                        </button>
                      )}
                      {shouldCut !== undefined && (
                        <span
                          className={cn(
                            "shrink-0 text-xs font-medium flex items-center gap-1",
                            shouldCut ? "text-success" : "text-base-content/60"
                          )}
                          aria-label={shouldCut ? "Cut this wire" : "Do not cut this wire"}
                        >
                          {shouldCut ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Cut
                            </>
                          ) : (
                            "Leave"
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Solution + Twitch in success callout */}
          {solution.length > 0 && (
            <div
              className="rounded-lg border border-success/30 bg-success/10 p-4 space-y-3"
              role="status"
              aria-live="polite"
            >
              <h4 className="text-sm font-semibold text-success">Instructions</h4>
              <ul className="space-y-1 text-sm">
                {wires.map((wire, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-base-content/70">Wire #{index + 1}:</span>
                    <span className={solution[index] ? "text-success font-medium" : "text-base-content/80"}>
                      {solution[index] ? "Cut the wire" : "Don't cut the wire"}
                    </span>
                  </li>
                ))}
              </ul>
              {twitchCommands.length > 0 && (
                <TwitchCommandDisplay command={twitchCommands} className="mb-0" />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls – dynamic primary action and label */}
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

      <CardDescription className="mt-2">
        Wire Sequences has 4 stages. For each stage add 1–3 wires (color + letter A/B/C), solve to get cut/leave instructions, then advance. Counts are tracked across stages.
      </CardDescription>
    </SolverLayout>
  );
}
