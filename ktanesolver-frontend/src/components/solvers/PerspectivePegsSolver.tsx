import { useCallback, useMemo, useState } from "react";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import {
  solvePerspectivePegs,
  type PerspectivePeg,
  type PerspectivePegsInput,
  type PerspectivePegsOutput,
} from "../../services/perspectivePegsService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  ErrorAlert,
  SolverResult,
  type ColorSwatchOption,
} from "../common";
import { cn } from "../../lib/cn";

interface PerspectivePegsSolverProps {
  bomb: BombEntity | null | undefined;
}

type PegColor = "Red" | "Yellow" | "Green" | "Blue" | "Purple";

const COLOR_OPTIONS: ReadonlyArray<ColorSwatchOption<PegColor>> = [
  { value: "Red", label: "Red", swatch: "bg-red-500" },
  { value: "Yellow", label: "Yellow", swatch: "bg-yellow-400" },
  { value: "Green", label: "Green", swatch: "bg-green-500" },
  { value: "Blue", label: "Blue", swatch: "bg-blue-500" },
  { value: "Purple", label: "Purple", swatch: "bg-purple-500" },
];

const COLOR_VALUES = COLOR_OPTIONS.map((option) => option.value);

const SIDE_LABELS = ["Top", "Upper right", "Lower right", "Lower left", "Upper left"] as const;
// Pentagon (flat-top) sliced into 5 triangles from the center to each edge.
// Each side triangle: center (50,50) + the two vertices forming that edge.
const SIDE_POLYGONS = [
  "50,50 23.6,13.6 76.4,13.6", // Top
  "50,50 76.4,13.6 92.8,63.9", // Upper right
  "50,50 92.8,63.9 50,95",     // Lower right
  "50,50 50,95 7.2,63.9",      // Lower left
  "50,50 7.2,63.9 23.6,13.6",  // Upper left
] as const;
const PEG_LAYOUT = [
  { label: "Top", short: "TOP", left: "50%", top: "18%" },
  { label: "Upper right", short: "UR", left: "80%", top: "42%" },
  { label: "Lower right", short: "LR", left: "68%", top: "80%" },
  { label: "Lower left", short: "LL", left: "32%", top: "80%" },
  { label: "Upper left", short: "UL", left: "20%", top: "42%" },
] as const;
const COLOR_HEX: Record<PegColor, string> = {
  Red: "#ef4444",
  Yellow: "#facc15",
  Green: "#22c55e",
  Blue: "#3b82f6",
  Purple: "#a855f7",
};

const defaultPegs = (): PerspectivePeg[] =>
  Array.from({ length: 5 }, () => ({ sideColors: Array.from({ length: 5 }, () => "") }));

function isPegColor(value: string): value is PegColor {
  return COLOR_VALUES.includes(value as PegColor);
}

function normalizePegs(value: PerspectivePeg[] | undefined): PerspectivePeg[] | null {
  if (!Array.isArray(value) || value.length !== 5) return null;
  return value.map((peg) => ({
    sideColors: normalizeSideColors(peg),
  }));
}

function normalizeSideColors(peg: PerspectivePeg | undefined): string[] {
  if (Array.isArray(peg?.sideColors) && peg.sideColors.length === 5) {
    return peg.sideColors.map((color) => typeof color === "string" ? color : "");
  }
  return Array.from({ length: 5 }, () => "");
}

export default function PerspectivePegsSolver({ bomb }: PerspectivePegsSolverProps) {
  const [pegs, setPegs] = useState<PerspectivePeg[]>(() => defaultPegs());
  const [selectedColor, setSelectedColor] = useState<PegColor>("Red");
  const [result, setResult] = useState<PerspectivePegsOutput | null>(null);

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
    () => ({ pegs, result }),
    [pegs, result],
  );

  const onRestoreState = useCallback((state: {
    pegs?: PerspectivePeg[];
    result?: PerspectivePegsOutput | null;
    input?: PerspectivePegsInput;
  }) => {
    const restoredPegs = normalizePegs(state.pegs) ?? normalizePegs(state.input?.pegs);
    if (restoredPegs) setPegs(restoredPegs);
    if (state.result !== undefined) setResult(state.result);
  }, []);

  const onRestoreSolution = useCallback((solution: PerspectivePegsOutput) => {
    if (!solution?.pressPositions?.length) return;
    setResult(solution);
  }, []);

  useSolverModulePersistence<
    typeof moduleState,
    PerspectivePegsOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null || typeof raw !== "object") return null;
      const candidate = raw as { output?: unknown; pressPositions?: unknown };
      const output = candidate.output && typeof candidate.output === "object"
        ? candidate.output as PerspectivePegsOutput
        : candidate as PerspectivePegsOutput;
      return Array.isArray(output.pressPositions) ? output : null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const clearStaleSolution = useCallback(() => {
    setResult(null);
    clearError();
  }, [clearError]);

  const updatePegSideColor = (pegIndex: number, sideIndex: number, color: PegColor) => {
    if (isLoading || isSolved) return;
    setPegs((prev) => prev.map((peg, i) => {
      if (i !== pegIndex) return peg;
      const sideColors = normalizeSideColors(peg);
      sideColors[sideIndex] = color;
      return { ...peg, sideColors };
    }));
    clearStaleSolution();
  };

  const buildInput = useCallback((): PerspectivePegsInput => ({
    pegs,
  }), [pegs]);

  const canSolve = useMemo(() => {
    return pegs.every((peg) => normalizeSideColors(peg).every(isPegColor));
  }, [pegs]);

  const solveModule = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }
    if (!canSolve) {
      setError("Fill all peg side colors.");
      return;
    }

    clearError();
    setIsLoading(true);

    try {
      const response = await solvePerspectivePegs(round.id, bomb.id, currentModule.id, { input: buildInput() });
      const output = response.output;

      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { pegs, result: output },
        output,
        true,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Perspective Pegs.");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, canSolve, clearError, setIsLoading, setError, setIsSolved, markModuleSolved, updateModuleAfterSolve, buildInput, pegs]);

  const reset = useCallback(() => {
    setPegs(defaultPegs());
    setResult(null);
    resetSolverState();
  }, [resetSolverState]);

  return (
    <SolverLayout>
      <SolverSection
        title="Fixed pegs"
        description="Enter the five side colors for each peg in the fixed module positions."
      >
        <div className="relative z-10 mb-6 flex flex-wrap items-center justify-center gap-2" role="radiogroup" aria-label="Paint color">
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selectedColor === option.value}
              aria-label={option.label}
              title={option.label}
              disabled={isLoading || isSolved}
              onClick={() => setSelectedColor(option.value)}
              className={cn(
                "h-8 w-8 rounded-full border border-border text-[10px] font-semibold text-white shadow-sm transition-all",
                selectedColor === option.value
                  ? "ring-2 ring-ring ring-offset-2 ring-offset-card"
                  : "opacity-75 hover:opacity-100",
                option.value === "Yellow" && "text-slate-950",
                (isLoading || isSolved) && "cursor-not-allowed opacity-60",
              )}
              style={{ backgroundColor: COLOR_HEX[option.value] }}
            >
              {option.value[0]}
            </button>
          ))}
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden rounded-md border border-border bg-muted/10">
          {pegs.map((peg, pegIndex) => {
            const layout = PEG_LAYOUT[pegIndex];
            const sideColors = normalizeSideColors(peg);
            const pressStep = result?.pressPositions.indexOf(layout.label) ?? -1;
            const isViewPosition = result?.viewPosition === layout.label;
            return (
              <div
                key={layout.label}
                className="absolute h-[clamp(4.5rem,14vw,6.5rem)] w-[clamp(4.5rem,14vw,6.5rem)] -translate-x-1/2 -translate-y-1/2"
                style={{ left: layout.left, top: layout.top }}
              >
                <svg
                  viewBox="0 0 100 100"
                  className="h-full w-full drop-shadow-sm"
                  aria-label={`${layout.label} peg${isViewPosition ? ", view from here" : ""}${pressStep >= 0 ? `, press ${pressStep + 1}` : ""}`}
                >
                  {sideColors.map((color, sideIndex) => {
                    const fill = isPegColor(color) ? COLOR_HEX[color] : "#f8fafc";
                    return (
                      <polygon
                        key={sideIndex}
                        points={SIDE_POLYGONS[sideIndex]}
                        fill={fill}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                        role="button"
                        tabIndex={isLoading || isSolved ? -1 : 0}
                        aria-label={`${layout.label} peg ${SIDE_LABELS[sideIndex]} side`}
                        onClick={() => updatePegSideColor(pegIndex, sideIndex, selectedColor)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            updatePegSideColor(pegIndex, sideIndex, selectedColor);
                          }
                        }}
                        className={cn(
                          "transition-opacity",
                          isLoading || isSolved ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:opacity-80",
                        )}
                      />
                    );
                  })}
                  {isViewPosition && (
                    <polygon
                      points="23.6,13.6 76.4,13.6 92.8,63.9 50,95 7.2,63.9"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="5"
                      strokeLinejoin="round"
                      pointerEvents="none"
                    />
                  )}
                  <circle
                    cx="50"
                    cy="50"
                    r="14"
                    fill={pressStep >= 0 ? "#16a34a" : "hsl(var(--card))"}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                    pointerEvents="none"
                  />
                  <text
                    x="50"
                    y="51"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={cn(
                      "font-semibold",
                      pressStep >= 0 ? "fill-white text-[18px]" : "fill-foreground text-[11px]",
                    )}
                    pointerEvents="none"
                  >
                    {pressStep >= 0 ? pressStep + 1 : layout.short}
                  </text>
                </svg>
              </div>
            );
          })}
        </div>
        {result && (
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground" aria-label="Solution markers">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border-2 border-cyan-500" aria-hidden="true" />
              View from {result.viewPosition}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1 text-[10px] font-bold text-white" aria-hidden="true">1–3</span>
              Press order
            </span>
          </div>
        )}
      </SolverSection>

      <SolverControls
        onSolve={solveModule}
        onReset={reset}
        isSolveDisabled={!canSolve || isSolved}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result && (
        <SolverResult
          variant="success"
          title="Press sequence"
          description={`View from: ${result.viewPosition}
Press: ${result.pressPositions.join(" → ")}
Key color: ${result.keyColor}
Current sequence: ${result.currentSequence.join(" ")}
Key sequence: ${result.keySequence.join(" ")}`}
        />
      )}

      <SolverInstructions>
        Enter all five sides of each fixed peg. The solver returns the viewing angle and the three fixed pegs to press in order.
      </SolverInstructions>
    </SolverLayout>
  );
}
