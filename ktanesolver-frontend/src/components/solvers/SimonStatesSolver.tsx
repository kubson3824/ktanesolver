import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveSimonStates, type SimonStatesColor } from "../../services/simonStatesService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  StageIndicator,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverResult,
} from "../common";
import { cn } from "../../lib/cn";

interface SimonStatesSolverProps {
  bomb: BombEntity | null | undefined;
}

interface StageResult {
  stage: number;
  flashes: SimonStatesColor[];
  press: SimonStatesColor;
}

interface ColorSpec {
  color: SimonStatesColor;
  label: string;
  /** Solid button base (darker when idle). */
  base: string;
  /** Solid button lit (selected / highlighted). */
  lit: string;
  /** Chip bg/border for sequence list. */
  chip: string;
  /** Chip text color. */
  chipText: string;
}

const COLORS: readonly ColorSpec[] = [
  {
    color: "RED",
    label: "Red",
    base: "bg-red-700 hover:bg-red-600",
    lit: "bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.65)]",
    chip: "bg-red-500/15 border-red-500/40",
    chipText: "text-red-700 dark:text-red-300",
  },
  {
    color: "YELLOW",
    label: "Yellow",
    base: "bg-yellow-600 hover:bg-yellow-500",
    lit: "bg-yellow-300 shadow-[0_0_18px_rgba(253,224,71,0.7)]",
    chip: "bg-yellow-500/15 border-yellow-500/40",
    chipText: "text-yellow-700 dark:text-yellow-300",
  },
  {
    color: "GREEN",
    label: "Green",
    base: "bg-green-700 hover:bg-green-600",
    lit: "bg-green-400 shadow-[0_0_18px_rgba(74,222,128,0.7)]",
    chip: "bg-green-500/15 border-green-500/40",
    chipText: "text-green-700 dark:text-green-300",
  },
  {
    color: "BLUE",
    label: "Blue",
    base: "bg-blue-700 hover:bg-blue-600",
    lit: "bg-blue-400 shadow-[0_0_18px_rgba(96,165,250,0.7)]",
    chip: "bg-blue-500/15 border-blue-500/40",
    chipText: "text-blue-700 dark:text-blue-300",
  },
] as const;

// Module button layout: RED top-left, YELLOW top-right, GREEN bottom-left, BLUE bottom-right
const GRID_LAYOUT: SimonStatesColor[] = ["RED", "YELLOW", "GREEN", "BLUE"];

function spec(color: SimonStatesColor): ColorSpec {
  return COLORS.find((c) => c.color === color)!;
}

function Chip({
  color,
  className,
}: {
  color: SimonStatesColor;
  className?: string;
}) {
  const s = spec(color);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
        s.chip,
        s.chipText,
        className,
      )}
    >
      {s.label}
    </span>
  );
}

export default function SimonStatesSolver({ bomb }: SimonStatesSolverProps) {
  const [topLeft, setTopLeft] = useState<SimonStatesColor | null>(null);
  const [flashes, setFlashes] = useState<Set<SimonStatesColor>>(new Set());
  const [currentStage, setCurrentStage] = useState(1);
  const [stageHistory, setStageHistory] = useState<StageResult[]>([]);
  const [result, setResult] = useState<SimonStatesColor | null>(null);
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);

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
    () => ({ topLeft, currentStage, stageHistory, result, twitchCommands }),
    [topLeft, currentStage, stageHistory, result, twitchCommands],
  );

  const onRestoreState = useCallback((state: unknown) => {
    const s = state as Record<string, unknown>;
    if (Array.isArray(s.pressHistory)) {
      const pressHistory = s.pressHistory as SimonStatesColor[];
      setCurrentStage(Math.min(pressHistory.length + 1, 4));
      if (typeof s.topLeft === "string") setTopLeft(s.topLeft as SimonStatesColor);
      setStageHistory([]);
      setResult(null);
      setFlashes(new Set());
      return;
    }
    if (typeof s.topLeft === "string") setTopLeft(s.topLeft as SimonStatesColor);
    if (typeof s.currentStage === "number") setCurrentStage(s.currentStage);
    if (Array.isArray(s.stageHistory)) setStageHistory(s.stageHistory as StageResult[]);
    if (typeof s.result === "string" || s.result === null)
      setResult(s.result as SimonStatesColor | null);
    if (Array.isArray(s.twitchCommands)) setTwitchCommands(s.twitchCommands as string[]);
  }, []);

  const onRestoreSolution = useCallback((solution: { press: SimonStatesColor } | null) => {
    if (!solution) return;
    setResult(solution.press);
  }, []);

  useSolverModulePersistence<
    {
      topLeft: SimonStatesColor | null;
      currentStage: number;
      stageHistory: StageResult[];
      result: SimonStatesColor | null;
      twitchCommands: string[];
    },
    { press: SimonStatesColor } | null
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const r = raw as { output?: { press?: SimonStatesColor }; press?: SimonStatesColor };
      if (r.output?.press) return { press: r.output.press };
      if (r.press) return { press: r.press };
      return null;
    },
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const toggleFlash = (color: SimonStatesColor) => {
    if (isSolved || isLoading) return;
    setFlashes((prev) => {
      const next = new Set(prev);
      if (next.has(color)) next.delete(color);
      else next.add(color);
      return next;
    });
    clearError();
    setResult(null);
  };

  const handleSolve = async () => {
    if (!topLeft) {
      setError("Select the top-left button colour first");
      return;
    }
    if (flashes.size === 0) {
      setError("Select at least one colour that flashed");
      return;
    }
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveSimonStates(round.id, bomb.id, currentModule.id, {
        input: {
          stage: currentStage,
          topLeft,
          flashes: Array.from(flashes),
        },
      });

      const press = response.output.press;
      setResult(press);

      const cmd = generateTwitchCommand({
        moduleType: ModuleType.SIMON_STATES,
        result: { press },
      });

      const newHistory: StageResult[] = [
        ...stageHistory,
        { stage: currentStage, flashes: Array.from(flashes), press },
      ];
      const newCommands = [...twitchCommands, cmd];

      setStageHistory(newHistory);
      setTwitchCommands(newCommands);

      if (response.solved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
      } else {
        setCurrentStage(currentStage + 1);
        setFlashes(new Set());
        setResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Simon States");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setTopLeft(null);
    setFlashes(new Set());
    setCurrentStage(1);
    setStageHistory([]);
    setResult(null);
    setTwitchCommands([]);
    resetSolverState();
  };

  const topLeftLocked = currentStage > 1 || isSolved;

  return (
    <SolverLayout>
      <SolverSection
        title="Top-left button colour"
        description="Which colour is in the top-left position on the module? Locked after the first stage."
      >
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => {
            const selected = topLeft === c.color;
            return (
              <button
                key={c.color}
                type="button"
                onClick={() => setTopLeft(c.color)}
                disabled={topLeftLocked}
                aria-pressed={selected}
                className={cn(
                  "inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors",
                  selected
                    ? cn(c.chip, c.chipText, "ring-2 ring-ring ring-offset-1 ring-offset-background")
                    : cn(c.chip, c.chipText, "opacity-60 hover:opacity-100"),
                  topLeftLocked && "cursor-not-allowed opacity-60",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </SolverSection>

      <SolverSection
        title="Stage progress"
        description={isSolved ? "All 4 stages complete." : `Stage ${currentStage} of 4`}
      >
        <StageIndicator
          total={4}
          current={isSolved ? 5 : currentStage}
          completedThrough={isSolved ? 4 : currentStage - 1}
        />
      </SolverSection>

      {!isSolved && (
        <SolverSection
          title={`Stage ${currentStage} flashes`}
          description="Toggle every colour that lit up during this stage."
        >
          <div className="mx-auto grid max-w-[260px] grid-cols-2 gap-3">
            {GRID_LAYOUT.map((color) => {
              const c = spec(color);
              const active = flashes.has(color);
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleFlash(color)}
                  disabled={isLoading}
                  aria-pressed={active}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-2xl border-2 border-black/10 text-sm font-semibold text-white transition-all duration-150",
                    active ? c.lit : c.base,
                    active && "scale-95",
                    isLoading && "cursor-not-allowed opacity-60",
                  )}
                >
                  <span className="drop-shadow-sm">{c.label}</span>
                </button>
              );
            })}
          </div>
        </SolverSection>
      )}

      {result && !isSolved && (
        <SolverResult
          variant="success"
          title="Press this colour"
          description={spec(result).label}
        />
      )}

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!topLeft || flashes.size === 0}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText={`Solve stage ${currentStage}`}
        loadingText="Solving…"
      />

      <ErrorAlert error={error} />

      {stageHistory.length > 0 && (
        <SolverSection title="Stage history">
          <ul className="space-y-1.5">
            {stageHistory.map((entry) => (
              <li
                key={entry.stage}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-1.5 text-sm"
              >
                <span className="shrink-0 font-medium text-muted-foreground">
                  Stage {entry.stage}
                </span>
                <span className="shrink-0 text-muted-foreground">flashed:</span>
                <div className="flex flex-wrap gap-1">
                  {entry.flashes.map((c) => (
                    <Chip key={c} color={c} />
                  ))}
                </div>
                <span className="shrink-0 text-muted-foreground" aria-hidden>
                  →
                </span>
                <span className="shrink-0 text-muted-foreground">press:</span>
                <Chip color={entry.press} />
              </li>
            ))}
          </ul>
        </SolverSection>
      )}

      {twitchCommands.length > 0 && <TwitchCommandDisplay command={twitchCommands} />}

      <SolverInstructions>
        Record which coloured buttons flashed each stage. The solver works out which
        button to press next based on strikes, stage, and the top-left colour.
      </SolverInstructions>
    </SolverLayout>
  );
}
