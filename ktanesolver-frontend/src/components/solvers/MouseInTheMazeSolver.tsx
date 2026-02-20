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
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { useRoundStore } from "../../store/useRoundStore";
import { cn } from "../../lib/cn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const SPHERE_OPTIONS: { value: SphereColor; label: string }[] = [
  { value: "GREEN", label: "Green" },
  { value: "BLUE", label: "Blue" },
  { value: "WHITE", label: "White" },
  { value: "YELLOW", label: "Yellow" },
];

const DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
  { value: "UP", label: "Up" },
  { value: "DOWN", label: "Down" },
  { value: "LEFT", label: "Left" },
  { value: "RIGHT", label: "Right" },
];

interface MouseInTheMazeSolverProps {
  bomb: BombEntity | null | undefined;
}

const STEPS_TO_WALL_INITIAL = [0, 0, 0, 0] as const;

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

  function clampStep(n: number): number {
    return Math.min(9, Math.max(0, Number(n) || 0));
  }

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
        return "Backward";
      case "TURN_LEFT":
        return "L";
      case "TURN_RIGHT":
        return "R";
      default:
        return m;
    }
  };

  const DirectionArrow = ({ direction, className }: { direction: Direction; className?: string }) => {
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
  };

  const sphereColorClass = (color: SphereColor): string => {
    switch (color) {
      case "GREEN":
        return "bg-green-500";
      case "BLUE":
        return "bg-blue-500";
      case "WHITE":
        return "bg-gray-300 border border-base-content/20";
      case "YELLOW":
        return "bg-yellow-400";
      default:
        return "bg-base-content/30";
    }
  };

  /** Start cell for path display: from result when using sphere identification, else not applicable. */
  const startCellForPath = result?.startCell ?? null;

  /** Compute path cells and direction from start by applying moves. 1-based row/col. */
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
              ([_, cell]) => cell.row === r && cell.col === c
            )
          : null;
        const sphereColor = sphereAtCell ? sphereAtCell[0] : null;

        const symbols: React.ReactNode[] = [];
        if (isStart) {
          symbols.push(
            <DirectionArrow
              key="start"
              direction={startDirection}
              className="h-6 w-6 shrink-0 text-success-content"
            />
          );
        } else if (isOnPath && pathInfo?.outgoingDir != null) {
          symbols.push(
            <DirectionArrow
              key="path"
              direction={pathInfo.outgoingDir}
              className="h-4 w-4 shrink-0 text-success/90"
            />
          );
        }
        if (sphereColor != null) {
          symbols.push(
            <div
              key={`sphere-${sphereColor}`}
              className={cn("h-4 w-4 shrink-0 rounded-full border border-base-content/20", sphereColorClass(sphereColor))}
              title={sphereColor}
            />
          );
        }
        if (isTarget && result) {
          symbols.push(
            <span
              key="target"
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-error bg-error/40 text-error-content text-xs font-bold"
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
                ? `Start (detected), row ${r}, column ${c}, facing ${startDirection}`
                : isTarget
                  ? `Target sphere, row ${r}, column ${c}`
                  : isOnPath
                    ? `Path step, row ${r}, column ${c}`
                    : sphereColor
                      ? `${sphereColor} sphere, row ${r}, column ${c}`
                      : `Cell row ${r}, column ${c}`
            }
            className={cn(
              "relative min-w-[2.25rem] min-h-[2.25rem] w-10 h-10 border border-base-content/25",
              "flex items-center justify-center",
              !isStart && !isTarget && !sphereColor && !isOnPath && "bg-base-300",
              isStart && "bg-success/40 border-success/50",
              isTarget && "bg-error/30 border-error/50",
              isOnPath && !isStart && !isTarget && "bg-success/25 border-success/40",
              sphereColor && !isTarget && !isOnPath && "bg-base-200"
            )}
          >
            {(hasRightWall || hasBottomWall || hasLeftWall || hasTopWall) && (
              <svg
                viewBox="0 0 1 1"
                className="absolute pointer-events-none text-base-content"
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
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Mouse In The Maze</CardTitle>
          <CardDescription>
            Go to the nearest sphere, report its colour and the four distances to the nearest wall (in any order — you don’t need to know which way is “up”). Enter the four distances in any order; the solver will try all combinations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Sphere colour at your position</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SPHERE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSphereColorAtPosition(opt.value)}
                  disabled={isSolved}
                  className={`btn btn-sm ${sphereColorAtPosition === opt.value ? "btn-primary" : "btn-outline"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Steps to wall (four distances, any order)</span>
            </label>
            <p className="text-sm text-base-content/70 mb-1">Number of moves before hitting a wall or edge in each direction. Enter in any order.</p>
            <div className="flex flex-wrap gap-2 items-center">
              {([0, 1, 2, 3] as const).map((i) => (
                <input
                  key={i}
                  type="number"
                  min={0}
                  max={9}
                  className="input input-bordered w-16 text-center"
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

          <div className="form-control">
            <label className="label">
              <span className="label-text">Torus colour</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SPHERE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTorusColor(opt.value)}
                  disabled={isSolved}
                  className={`btn btn-sm ${torusColor === opt.value ? "btn-primary" : "btn-outline"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Start direction</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DIRECTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStartDirection(opt.value)}
                  disabled={isSolved}
                  className={`btn btn-sm ${startDirection === opt.value ? "btn-primary" : "btn-outline"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {result?.maze && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-center">Maze</CardTitle>
            <CardDescription id={mazeGridDescId} className="text-center">
              10×10 grid: start (arrow), colored spheres, path (green), target (✓).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              id={mazeGridId}
              role="grid"
              aria-label="Maze grid, 10 by 10 cells"
              aria-describedby={mazeGridDescId}
              className="relative inline-grid max-w-2xl mx-auto border-2 border-base-content/40 rounded overflow-hidden bg-base-content/10"
              style={{
                gridTemplateColumns: "auto repeat(10, 1fr)",
                gridTemplateRows: "auto repeat(10, 1fr)",
              }}
            >
              <div className="min-w-[2.25rem] min-h-[2.25rem] w-10 h-10 bg-base-300" aria-hidden />
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => (
                <div
                  key={`col-${c}`}
                  className="min-w-[2.25rem] min-h-[2.25rem] w-10 h-10 flex items-center justify-center bg-base-300 text-xs text-base-content/70 font-medium"
                  aria-hidden
                >
                  {c}
                </div>
              ))}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((row) => (
                <Fragment key={`row-${row}`}>
                  <div
                    className="min-w-[2.25rem] min-h-[2.25rem] w-10 h-10 flex items-center justify-center bg-base-300 text-xs text-base-content/70 font-medium"
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
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="mb-4 border-success/50 bg-success/5">
          <CardHeader>
            <CardTitle className="text-success">Solution</CardTitle>
            <CardDescription>
              Target sphere: <strong>{result.targetSphereColor}</strong>
              {result.targetCell && ` at (${result.targetCell.row}, ${result.targetCell.col})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {result.moves.map((m, i) => (
                <span
                  key={i}
                  className="badge badge-lg badge-success gap-1"
                >
                  {moveLabel(m)}
                </span>
              ))}
            </div>
            <p className="text-sm text-base-content/70 mt-2">
              {result.moves.length} move{result.moves.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-base-content/60 mt-2">
              All moves are from the <strong>mouse’s perspective</strong>: L = turn left, R = turn right, Fwd = one step in the direction the mouse is facing, Backward = one step in the opposite direction.
            </p>
          </CardContent>
        </Card>
      )}

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={false}
        isLoading={isLoading}
        solveText="Solve"
      />

      <ErrorAlert error={error} />
      <TwitchCommandDisplay command={twitchCommand} />
    </SolverLayout>
  );
}
