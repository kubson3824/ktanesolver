import { Fragment, useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  solveMouseInTheMaze,
  type SphereColor,
  type Direction,
  type MouseMove,
  type Cell,
  type MouseInTheMazeSolveResponse,
  type MouseInTheMazeMaze,
} from "../../services/mouseInTheMazeService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  SolverResult,
  SegmentedControl,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { useRoundStore } from "../../store/useRoundStore";
import { cn } from "../../lib/cn";
import { Input } from "../ui/input";

const SPHERE_OPTIONS: ReadonlyArray<{ value: SphereColor; label: string; swatch: string }> = [
  { value: "GREEN", label: "Green", swatch: "bg-green-500" },
  { value: "BLUE", label: "Blue", swatch: "bg-blue-500" },
  { value: "WHITE", label: "White", swatch: "bg-gray-200 border border-border" },
  { value: "YELLOW", label: "Yellow", swatch: "bg-yellow-400" },
];

const DIRECTION_OPTIONS: ReadonlyArray<{ value: Direction; label: string }> = [
  { value: "UP", label: "Up" },
  { value: "DOWN", label: "Down" },
  { value: "LEFT", label: "Left" },
  { value: "RIGHT", label: "Right" },
];

interface MouseInTheMazeSolverProps {
  bomb: BombEntity | null | undefined;
}

const STEPS_TO_WALL_INITIAL = [0, 0, 0, 0] as const;

function clampStep(n: number): number {
  return Math.min(9, Math.max(0, Number(n) || 0));
}

function DirectionArrow({ direction, className }: { direction: Direction; className?: string }) {
  const path =
    direction === "UP"
      ? "M12 4l-8 8h5v8h6v-8h5L12 4z"
      : direction === "DOWN"
        ? "M12 20l8-8h-5V4h-6v8H4l8 8z"
        : direction === "LEFT"
          ? "M4 12l8 8v-5h8v-6h-8V4L4 12z"
          : "M20 12l-8-8v5H4v6h8v5l8-8z";
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d={path} />
    </svg>
  );
}

function sphereSwatch(color: SphereColor): string {
  return SPHERE_OPTIONS.find((o) => o.value === color)?.swatch ?? "bg-muted";
}

function ColorPicker({
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  value: SphereColor;
  onChange: (v: SphereColor) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {SPHERE_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "border-ring bg-accent/15 text-foreground ring-2 ring-ring ring-offset-1 ring-offset-card"
                : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <span className={cn("h-3.5 w-3.5 rounded-full", opt.swatch)} aria-hidden />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function MouseInTheMazeSolver({ bomb }: MouseInTheMazeSolverProps) {
  const [sphereColorAtPosition, setSphereColorAtPosition] = useState<SphereColor>("GREEN");
  const [stepsToWall, setStepsToWall] = useState<[number, number, number, number]>([...STEPS_TO_WALL_INITIAL]);
  const [torusColor, setTorusColor] = useState<SphereColor>("GREEN");
  const [startDirection, setStartDirection] = useState<Direction>("UP");
  const [result, setResult] = useState<MouseInTheMazeSolveResponse["output"] | null>(null);
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
    () => ({
      sphereColorAtPosition,
      stepsToWall,
      torusColor,
      startDirection,
      result,
      twitchCommand,
    }),
    [sphereColorAtPosition, stepsToWall, torusColor, startDirection, result, twitchCommand]
  );

  const onRestoreState = useCallback(
    (state: {
      sphereColorAtPosition?: SphereColor;
      stepsToWall?: number[];
      torusColor?: SphereColor;
      startDirection?: Direction;
      result?: MouseInTheMazeSolveResponse["output"] | null;
      twitchCommand?: string;
      input?: {
        sphereColorAtPosition?: SphereColor;
        stepsToWall?: number[];
        torusColor?: SphereColor;
        startDirection?: Direction;
      };
    }) => {
      const sphere = state.sphereColorAtPosition ?? state.input?.sphereColorAtPosition;
      if (sphere != null && SPHERE_OPTIONS.some((o) => o.value === sphere)) setSphereColorAtPosition(sphere);
      const steps = state.stepsToWall ?? state.input?.stepsToWall;
      if (Array.isArray(steps) && steps.length >= 4) {
        setStepsToWall([
          clampStep(steps[0]),
          clampStep(steps[1]),
          clampStep(steps[2]),
          clampStep(steps[3]),
        ]);
      }
      const torus = state.torusColor ?? state.input?.torusColor;
      if (torus != null && SPHERE_OPTIONS.some((o) => o.value === torus)) setTorusColor(torus);
      const dir = state.startDirection ?? state.input?.startDirection;
      if (dir != null && DIRECTION_OPTIONS.some((o) => o.value === dir)) setStartDirection(dir);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand != null) setTwitchCommand(state.twitchCommand);
    },
    []
  );

  const onRestoreSolution = useCallback(
    (solution: MouseInTheMazeSolveResponse["output"]) => {
      if (solution?.targetSphereColor != null) {
        setResult(solution);
        setTwitchCommand(
          generateTwitchCommand({ moduleType: ModuleType.MOUSE_IN_THE_MAZE, result: solution })
        );
      }
    },
    []
  );

  useSolverModulePersistence<
    typeof moduleState,
    MouseInTheMazeSolveResponse["output"]
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      const o = raw as { output?: MouseInTheMazeSolveResponse["output"] };
      if (o?.output?.targetSphereColor != null) return o.output;
      if ((raw as { targetSphereColor?: string }).targetSphereColor != null) return raw as MouseInTheMazeSolveResponse["output"];
      return null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveMouseInTheMaze(
        round.id,
        bomb.id,
        currentModule.id,
        {
          input: {
            torusColor,
            startDirection,
            sphereColorAtPosition,
            stepsToWall: [...stepsToWall],
          },
        }
      );

      if (response.reason) {
        setError(response.reason);
        return;
      }

      if (response.output) {
        const command = generateTwitchCommand({
          moduleType: ModuleType.MOUSE_IN_THE_MAZE,
          result: response.output,
        });
        setResult(response.output);
        setTwitchCommand(command);
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        updateModuleAfterSolve(bomb.id, currentModule.id, {
          sphereColorAtPosition,
          stepsToWall,
          torusColor,
          startDirection,
          result: response.output,
          twitchCommand: command,
        }, response.output, true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setSphereColorAtPosition("GREEN");
    setStepsToWall([...STEPS_TO_WALL_INITIAL]);
    setTorusColor("GREEN");
    setStartDirection("UP");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const moveLabel = (m: MouseMove): string => {
    switch (m) {
      case "FORWARD":
        return "Fwd";
      case "BACKWARD":
        return "Back";
      case "TURN_LEFT":
        return "L";
      case "TURN_RIGHT":
        return "R";
      default:
        return m;
    }
  };

  const startCellForPath = result?.startCell ?? null;

  const pathCells = useMemo(() => {
    if (!result?.moves?.length || !startCellForPath) return new Map<string, { stepIndex: number; outgoingDir: Direction | null }>();
    const turnLeft = (d: Direction): Direction =>
      d === "UP" ? "LEFT" : d === "LEFT" ? "DOWN" : d === "DOWN" ? "RIGHT" : "UP";
    const turnRight = (d: Direction): Direction =>
      d === "UP" ? "RIGHT" : d === "RIGHT" ? "DOWN" : d === "DOWN" ? "LEFT" : "UP";
    const delta = (d: Direction): [number, number] =>
      d === "UP" ? [-1, 0] : d === "DOWN" ? [1, 0] : d === "LEFT" ? [0, -1] : [0, 1];

    const map = new Map<string, { stepIndex: number; outgoingDir: Direction | null }>();
    let r = startCellForPath.row;
    let c = startCellForPath.col;
    let dir = startDirection;
    map.set(`${r},${c}`, { stepIndex: 0, outgoingDir: null });

    for (let i = 0; i < result.moves.length; i++) {
      const move = result.moves[i];
      if (move === "TURN_LEFT") {
        dir = turnLeft(dir);
      } else if (move === "TURN_RIGHT") {
        dir = turnRight(dir);
      } else if (move === "FORWARD") {
        const [dr, dc] = delta(dir);
        r += dr;
        c += dc;
        map.set(`${r},${c}`, { stepIndex: i + 1, outgoingDir: dir });
      } else {
        const [dr, dc] = delta(dir);
        r -= dr;
        c -= dc;
        const opp: Direction = dir === "UP" ? "DOWN" : dir === "DOWN" ? "UP" : dir === "LEFT" ? "RIGHT" : "LEFT";
        map.set(`${r},${c}`, { stepIndex: i + 1, outgoingDir: opp });
      }
    }
    return map;
  }, [result?.moves, startCellForPath, startDirection]);

  const renderMazeGrid = (maze: MouseInTheMazeMaze) => {
    const grid = [];
    const SIZE = 10;
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const r = row + 1;
        const c = col + 1;
        const hasBottomWall = row < SIZE - 1 && maze.horizontalWalls[row]?.[col];
        const hasRightWall = col < SIZE - 1 && maze.verticalWalls[row]?.[col];
        const hasTopWall = row > 0 && maze.horizontalWalls[row - 1]?.[col];
        const hasLeftWall = col > 0 && maze.verticalWalls[row]?.[col - 1];

        const isStart = startCellForPath != null && startCellForPath.row === r && startCellForPath.col === c;
        const isTarget = result?.targetCell && result.targetCell.row === r && result.targetCell.col === c;
        const pathInfo = pathCells.get(`${r},${c}`);
        const isOnPath = pathInfo !== undefined;
        const sphereAtCell = maze.spherePositions
          ? (Object.entries(maze.spherePositions) as [SphereColor, Cell][]).find(
              ([, cell]) => cell.row === r && cell.col === c
            )
          : null;
        const sphereColor = sphereAtCell ? sphereAtCell[0] : null;

        const symbols: React.ReactNode[] = [];
        if (isStart) {
          symbols.push(
            <DirectionArrow
              key="start"
              direction={startDirection}
              className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300"
            />
          );
        } else if (isOnPath && pathInfo?.outgoingDir != null) {
          symbols.push(
            <DirectionArrow
              key="path"
              direction={pathInfo.outgoingDir}
              className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            />
          );
        }
        if (sphereColor != null) {
          symbols.push(
            <div
              key={`sphere-${sphereColor}`}
              className={cn("h-3.5 w-3.5 shrink-0 rounded-full border border-border", sphereSwatch(sphereColor))}
              title={sphereColor}
            />
          );
        }
        if (isTarget && result) {
          symbols.push(
            <span
              key="target"
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-red-500 bg-red-500/40 text-xs font-bold text-red-900 dark:text-red-100"
            >
              ✓
            </span>
          );
        }

        grid.push(
          <div
            key={`${row}-${col}`}
            role="gridcell"
            aria-rowindex={r}
            aria-colindex={c}
            aria-label={
              isStart
                ? `Start, row ${r}, column ${c}, facing ${startDirection}`
                : isTarget
                  ? `Target sphere, row ${r}, column ${c}`
                  : isOnPath
                    ? `Path step, row ${r}, column ${c}`
                    : sphereColor
                      ? `${sphereColor} sphere, row ${r}, column ${c}`
                      : `Cell row ${r}, column ${c}`
            }
            className={cn(
              "relative flex h-9 w-9 min-h-[2.25rem] min-w-[2.25rem] items-center justify-center border border-border",
              !isStart && !isTarget && !sphereColor && !isOnPath && "bg-muted/40",
              isStart && "border-emerald-500/60 bg-emerald-500/25",
              isTarget && "border-red-500/60 bg-red-500/20",
              isOnPath && !isStart && !isTarget && "border-emerald-500/40 bg-emerald-500/15",
              sphereColor && !isTarget && !isOnPath && "bg-muted",
            )}
          >
            {(hasRightWall || hasBottomWall || hasLeftWall || hasTopWall) && (
              <svg
                viewBox="0 0 1 1"
                className="pointer-events-none absolute text-foreground"
                style={{
                  left: -1,
                  top: -1,
                  width: "calc(100% + 2px)",
                  height: "calc(100% + 2px)",
                }}
                preserveAspectRatio="none"
                stroke="currentColor"
                strokeWidth={0.12}
                strokeLinecap="square"
              >
                {hasRightWall && <line x1={1} y1={0} x2={1} y2={1} />}
                {hasBottomWall && <line x1={0} y1={1} x2={1} y2={1} />}
                {hasLeftWall && <line x1={0} y1={0} x2={0} y2={1} />}
                {hasTopWall && <line x1={0} y1={0} x2={1} y2={0} />}
              </svg>
            )}
            {symbols.length > 0 && (
              <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 p-0.5">
                {symbols}
              </div>
            )}
          </div>
        );
      }
    }
    return grid;
  };

  const mazeGridId = "mouse-maze-grid";
  const mazeGridDescId = "mouse-maze-grid-desc";

  return (
    <SolverLayout>
      <SolverSection
        title="Current position"
        description="Go to the nearest sphere, then report its colour and the four distances to the nearest wall in each direction (any order)."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Sphere colour at your position</p>
            <ColorPicker
              value={sphereColorAtPosition}
              onChange={setSphereColorAtPosition}
              disabled={isSolved}
              ariaLabel="Sphere colour at your position"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Steps to wall (any order)</p>
            <p className="text-xs text-muted-foreground">
              Moves before hitting a wall or edge in each of the four directions.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {([0, 1, 2, 3] as const).map((i) => (
                <Input
                  key={i}
                  type="number"
                  min={0}
                  max={9}
                  className="w-16 text-center"
                  value={stepsToWall[i]}
                  onChange={(e) => {
                    const v = clampStep(Number(e.target.value));
                    setStepsToWall((prev) => {
                      const next = [...prev] as [number, number, number, number];
                      next[i] = v;
                      return next;
                    });
                  }}
                  disabled={isSolved}
                  aria-label={`Distance ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </SolverSection>

      <SolverSection
        title="Torus &amp; facing"
        description="The torus colour (the goal marker) and the direction you are facing at the start."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Torus colour</p>
            <ColorPicker
              value={torusColor}
              onChange={setTorusColor}
              disabled={isSolved}
              ariaLabel="Torus colour"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Start direction</p>
            <SegmentedControl
              value={startDirection}
              onChange={setStartDirection}
              options={DIRECTION_OPTIONS}
              disabled={isSolved}
              ariaLabel="Start direction"
            />
          </div>
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isLoading={isLoading}
        isSolved={isSolved}
      />

      <ErrorAlert error={error} />

      {result && (
        <SolverResult
          variant="success"
          title="Target sphere"
          description={
            result.targetCell
              ? `${result.targetSphereColor} at row ${result.targetCell.row}, column ${result.targetCell.col}\nMoves: ${result.moves.length}`
              : `${result.targetSphereColor}\nMoves: ${result.moves.length}`
          }
        />
      )}

      {result && result.moves.length > 0 && (
        <SolverSection
          title="Move sequence"
          description="L/R turn the mouse; Fwd/Back walks relative to the way it is facing."
        >
          <div className="flex flex-wrap gap-1.5">
            {result.moves.map((m, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300"
              >
                {moveLabel(m)}
              </span>
            ))}
          </div>
        </SolverSection>
      )}

      {result?.maze && (
        <SolverSection
          title="Maze"
          description="10×10 grid: arrow = start, coloured dots = spheres, green tint = path, red ✓ = target."
        >
          <div
            id={mazeGridId}
            role="grid"
            aria-label="Maze grid, 10 by 10 cells"
            aria-describedby={mazeGridDescId}
            className="relative mx-auto inline-grid max-w-full overflow-auto rounded border border-border bg-muted/20"
            style={{
              gridTemplateColumns: "auto repeat(10, 1fr)",
              gridTemplateRows: "auto repeat(10, 1fr)",
            }}
          >
            <div className="h-9 w-9 min-h-[2.25rem] min-w-[2.25rem] bg-muted/40" aria-hidden />
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => (
              <div
                key={`col-${c}`}
                className="flex h-9 w-9 min-h-[2.25rem] min-w-[2.25rem] items-center justify-center bg-muted/40 text-xs font-medium text-muted-foreground"
                aria-hidden
              >
                {c}
              </div>
            ))}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((row) => (
              <Fragment key={`row-${row}`}>
                <div
                  className="flex h-9 w-9 min-h-[2.25rem] min-w-[2.25rem] items-center justify-center bg-muted/40 text-xs font-medium text-muted-foreground"
                  aria-hidden
                >
                  {row + 1}
                </div>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) =>
                  renderMazeGrid(result.maze!)[row * 10 + col]
                )}
              </Fragment>
            ))}
          </div>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Enter the sphere you're standing on, the torus target colour, and the four distances. The
        solver identifies which maze you are in and returns the shortest path to the torus sphere.
      </SolverInstructions>
    </SolverLayout>
  );
}
