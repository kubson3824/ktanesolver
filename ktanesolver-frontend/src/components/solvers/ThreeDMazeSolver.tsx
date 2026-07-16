import { Fragment, useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  solveThreeDMaze,
  type ThreeDMazeOutput,
  type ThreeDMazeMaze,
  type ThreeDMazeSolveRequest,
  type ThreeDMazeSolveResponse,
  type MarkerLetter,
  type GoalDirection,
} from "../../services/threeDMazeService";
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

const MARKER_LETTERS: MarkerLetter[] = ["A", "B", "C", "D", "H"];
const GOAL_DIRECTIONS: ReadonlyArray<{ value: GoalDirection; label: string }> = [
  { value: "N", label: "N" },
  { value: "S", label: "S" },
  { value: "E", label: "E" },
  { value: "W", label: "W" },
];
type Dir = "N" | "S" | "E" | "W";
const SIZE = 8;
const turnLeft = (d: Dir): Dir => d === "N" ? "W" : d === "W" ? "S" : d === "S" ? "E" : "N";
const turnRight = (d: Dir): Dir => d === "N" ? "E" : d === "E" ? "S" : d === "S" ? "W" : "N";
const delta = (d: Dir): [number, number] => d === "N" ? [-1, 0] : d === "S" ? [1, 0] : d === "E" ? [0, 1] : [0, -1];

const endState = (output: ThreeDMazeOutput): { row: number; col: number; facing: Dir } | null => {
  if (output.startRow == null || output.startCol == null || !output.startFacing) return null;
  let row = output.startRow;
  let col = output.startCol;
  let facing = output.startFacing as Dir;
  for (const move of output.moves ?? []) {
    if (move === "TURN_LEFT") facing = turnLeft(facing);
    else if (move === "TURN_RIGHT") facing = turnRight(facing);
    else {
      const [dr, dc] = delta(facing);
      row = (row + dr + SIZE) % SIZE;
      col = (col + dc + SIZE) % SIZE;
    }
  }
  return { row, col, facing };
};

interface ThreeDMazeSolverProps {
  bomb: BombEntity | null | undefined;
}

const LETTER_AT_POSITION_OPTIONS = ["", "A", "B", "C", "D", "H", "N", "S", "E", "W"] as const;

export default function ThreeDMazeSolver({ bomb }: ThreeDMazeSolverProps) {
  const [starLetters, setStarLetters] = useState<[MarkerLetter, MarkerLetter, MarkerLetter]>(["A", "B", "C"]);
  const [goalDirection, setGoalDirection] = useState<GoalDirection | "">("");
  const [currentRow, setCurrentRow] = useState<number | null>(null);
  const [currentCol, setCurrentCol] = useState<number | null>(null);
  const [currentFacing, setCurrentFacing] = useState<GoalDirection | "">("");
  const [letterAtPosition, setLetterAtPosition] = useState<string>("");
  const [stepsToWall, setStepsToWall] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const [result, setResult] = useState<ThreeDMazeSolveResponse["output"] | null>(null);
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
    () => ({ starLetters, goalDirection, currentRow, currentCol, currentFacing, letterAtPosition, stepsToWall, result, twitchCommand }),
    [starLetters, goalDirection, currentRow, currentCol, currentFacing, letterAtPosition, stepsToWall, result, twitchCommand]
  );

  const onRestoreState = useCallback(
    (state: {
      starLetters?: [string, string, string];
      goalDirection?: string;
      currentRow?: number | null;
      currentCol?: number | null;
      currentFacing?: string;
      letterAtPosition?: string;
      stepsToWall?: [number, number, number, number];
      result?: ThreeDMazeOutput | null;
      twitchCommand?: string;
      input?: { starLetters?: string[]; goalDirection?: string; currentRow?: number; currentCol?: number; currentFacing?: string; letterAtPosition?: string; stepsToWall?: number[] };
    }) => {
      const letters = state.starLetters ?? state.input?.starLetters;
      if (Array.isArray(letters) && letters.length >= 3) {
        const valid = (s: string): MarkerLetter =>
          MARKER_LETTERS.includes(s as MarkerLetter) ? (s as MarkerLetter) : "A";
        const restored = [valid(letters[0]), valid(letters[1]), valid(letters[2])] as [MarkerLetter, MarkerLetter, MarkerLetter];
        setStarLetters(new Set(restored).size === 3 ? restored : ["A", "B", "C"]);
      }
      const dir = state.goalDirection ?? state.input?.goalDirection;
      if (dir && (["N", "S", "E", "W"] as const).includes(dir as GoalDirection)) {
        setGoalDirection(dir as GoalDirection);
      }
      const row = state.currentRow ?? state.input?.currentRow;
      const col = state.currentCol ?? state.input?.currentCol;
      if (typeof row === "number") setCurrentRow(row);
      if (typeof col === "number") setCurrentCol(col);
      const cf = state.currentFacing ?? state.input?.currentFacing;
      if (cf && (["N", "S", "E", "W"] as const).includes(cf as GoalDirection)) setCurrentFacing(cf as GoalDirection);
      const lap = state.letterAtPosition ?? state.input?.letterAtPosition;
      if (lap != null) setLetterAtPosition(lap);
      const st = state.stepsToWall ?? state.input?.stepsToWall;
      if (Array.isArray(st) && st.length === 4) setStepsToWall([st[0], st[1], st[2], st[3]]);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand != null) setTwitchCommand(state.twitchCommand);
    },
    []
  );

  const onRestoreSolution = useCallback((solution: ThreeDMazeOutput) => {
    if (solution?.goalRow != null && solution?.goalCol != null) {
      setResult(solution);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.THREE_D_MAZE,
          result: solution,
        })
      );
    }
  }, []);

  useSolverModulePersistence<
    { starLetters: [MarkerLetter, MarkerLetter, MarkerLetter]; goalDirection: GoalDirection | ""; currentRow: number | null; currentCol: number | null; currentFacing: GoalDirection | ""; letterAtPosition: string; stepsToWall: [number, number, number, number]; result: ThreeDMazeSolveResponse["output"] | null; twitchCommand: string },
    ThreeDMazeOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      const o = raw as { goalRow?: number; goalCol?: number; goalDirection?: string | null };
      if (typeof o.goalRow === "number" && typeof o.goalCol === "number") {
        return raw as ThreeDMazeOutput;
      }
      return null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }
    setIsLoading(true);
    clearError();
    try {
      const hasTrackedPosition = currentRow != null && currentCol != null && currentFacing !== "";
      const request: ThreeDMazeSolveRequest = {
        input: {
          starLetters: [...starLetters],
          ...(goalDirection !== "" ? { goalDirection } : {}),
          ...(hasTrackedPosition ? {
            currentRow,
            currentCol,
            currentFacing,
          } : {
            letterAtPosition: letterAtPosition || undefined,
            stepsToWall: [...stepsToWall],
          }),
        },
      };
      const response = await solveThreeDMaze(round.id, bomb.id, currentModule.id, request);
      const output = response.output;
      if (!output) {
        setError(response.reason ?? "Solve failed.");
        return;
      }
      setResult(output);
      const tracked = output.phase === "go_to_star" ? endState(output) : null;
      if (tracked) {
        setCurrentRow(tracked.row);
        setCurrentCol(tracked.col);
        setCurrentFacing(tracked.facing);
      }
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      setIsSolved(Boolean(response.solved));
      const command = generateTwitchCommand({
        moduleType: ModuleType.THREE_D_MAZE,
        result: output,
      });
      setTwitchCommand(command);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        {
          starLetters,
          goalDirection,
          currentRow: tracked?.row ?? currentRow,
          currentCol: tracked?.col ?? currentCol,
          currentFacing: tracked?.facing ?? currentFacing,
          letterAtPosition,
          stepsToWall,
          result: output,
          twitchCommand: command,
        },
        { goalRow: output.goalRow, goalCol: output.goalCol, goalDirection: output.goalDirection ?? undefined, moves: output.moves, startRow: output.startRow, startCol: output.startCol, startFacing: output.startFacing, phase: output.phase, message: output.message },
        Boolean(response.solved)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Solve failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStarLetters(["A", "B", "C"]);
    setGoalDirection("");
    setCurrentRow(null);
    setCurrentCol(null);
    setCurrentFacing("");
    setLetterAtPosition("");
    setStepsToWall([0, 0, 0, 0]);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const moveLabel = (m: string): string => {
    switch (m) {
      case "FORWARD": return "Fwd";
      case "TURN_LEFT": return "L";
      case "TURN_RIGHT": return "R";
      default: return m;
    }
  };

  const directionLabel: Record<string, string> = {
    N: "North",
    S: "South",
    E: "East",
    W: "West",
  };

  const pathCells = useMemo(() => {
    if (
      !result?.moves?.length ||
      result.startRow == null ||
      result.startCol == null ||
      !result.startFacing
    )
      return new Map<string, { stepIndex: number; outgoingDir: Dir | null }>();
    const dir = result.startFacing as Dir;
    if (!["N", "S", "E", "W"].includes(dir)) return new Map();
    const map = new Map<string, { stepIndex: number; outgoingDir: Dir | null }>();
    let r = result.startRow;
    let c = result.startCol;
    let d = dir;
    map.set(`${r},${c}`, { stepIndex: 0, outgoingDir: null });
    for (let i = 0; i < result.moves.length; i++) {
      const move = result.moves[i];
      if (move === "TURN_LEFT") {
        d = turnLeft(d);
      } else if (move === "TURN_RIGHT") {
        d = turnRight(d);
      } else if (move === "FORWARD") {
        const [dr, dc] = delta(d);
        r = (r + dr + SIZE) % SIZE;
        c = (c + dc + SIZE) % SIZE;
        map.set(`${r},${c}`, { stepIndex: i + 1, outgoingDir: d });
      }
    }
    return map;
  }, [result?.moves, result?.startRow, result?.startCol, result?.startFacing]);

  const DirectionArrow = ({ direction, className }: { direction: Dir; className?: string }) => {
    const path =
      direction === "N"
        ? "M12 4l-8 8h5v8h6v-8h5L12 4z"
        : direction === "S"
          ? "M12 20l8-8h-5V4h-6v8H4l8 8z"
          : direction === "W"
            ? "M4 12l8 8v-5h8v-6h-8V4L4 12z"
            : "M20 12l-8-8v5H4v6h8v5l8-8z";
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d={path} />
      </svg>
    );
  };

  const isStarCell = (maze: ThreeDMazeMaze, row: number, col: number): boolean => {
    const stars = maze.starPositions;
    if (!stars) return false;
    return stars.some((s) => s[0] === row && s[1] === col);
  };

  const renderMazeGrid = (maze: ThreeDMazeMaze) => {
    const grid: React.ReactNode[] = [];
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const hasBottomWall =
          row < SIZE - 1 ? maze.horizontalWalls[row]?.[col] : maze.horizontalWalls[7]?.[col];
        const hasRightWall =
          col < SIZE - 1 ? maze.verticalWalls[row]?.[col] : maze.verticalWalls[row]?.[7];
        const hasTopWall =
          row > 0 ? maze.horizontalWalls[row - 1]?.[col] : maze.horizontalWalls[7]?.[col];
        const hasLeftWall =
          col > 0 ? maze.verticalWalls[row]?.[col - 1] : maze.verticalWalls[row]?.[7];

        const isStart =
          result?.startRow === row && result?.startCol === col;
        const isGoal = result?.phase === "go_to_goal" && result.goalRow === row && result.goalCol === col;
        const pathInfo = pathCells.get(`${row},${col}`);
        const isOnPath = pathInfo !== undefined;
        const isStar = isStarCell(maze, row, col);
        const letter = maze.letterGrid?.[row]?.[col] ?? null;

        const symbols: React.ReactNode[] = [];
        const startFacing = result?.startFacing as Dir | undefined;
        if (isStart && startFacing != null) {
          symbols.push(
            <DirectionArrow
              key="start"
              direction={startFacing}
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
        if (isStar) {
          symbols.push(
            <span key="star" className="text-sm font-bold text-amber-500" title="Direction marker">
              *
            </span>
          );
        }
        if (letter != null && letter !== "") {
          symbols.push(
            <span key="letter" className="text-xs font-medium text-foreground/90">
              {letter}
            </span>
          );
        }
        if (isGoal && result) {
          symbols.push(
            <span
              key="goal"
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-red-500 bg-red-500/40 text-xs font-bold text-red-900 dark:text-red-100"
              title="Goal"
            >
              ✓
            </span>
          );
        }

        grid.push(
          <div
            key={`${row}-${col}`}
            role="gridcell"
            aria-rowindex={row}
            aria-colindex={col}
            aria-label={
              isStart
                ? `Start, row ${row}, column ${col}, facing ${result?.startFacing}`
                : isGoal
                  ? `Goal, row ${row}, column ${col}`
                  : isOnPath
                    ? `Path step, row ${row}, column ${col}`
                    : isStar
                      ? `Direction marker, row ${row}, column ${col}`
                      : `Cell row ${row}, column ${col}`
            }
            className={cn(
              "relative flex h-9 w-9 min-h-[2.25rem] min-w-[2.25rem] items-center justify-center border border-border",
              !isStart && !isGoal && !isStar && !isOnPath && "bg-muted/40",
              isStart && "border-emerald-500/60 bg-emerald-500/25",
              isGoal && "border-red-500/60 bg-red-500/20",
              isOnPath && !isStart && !isGoal && "border-emerald-500/40 bg-emerald-500/15",
              isStar && !isGoal && !isOnPath && "bg-muted",
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

  const mazeGridId = "threed-maze-grid";
  const mazeGridDescId = "threed-maze-grid-desc";
  const renderedMazeCells = result?.maze ? renderMazeGrid(result.maze) : [];

  return (
    <SolverLayout>
      <SolverSection
        title="Maze letters observed"
        description="Choose the three distinct A/B/C/D/H letters found on the floor. These are not the cardinal-direction markers."
      >
        <div className="flex flex-wrap gap-3">
          {([0, 1, 2] as const).map((i) => (
            <div key={i} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Letter {i + 1}</p>
              <SegmentedControl<MarkerLetter>
                value={starLetters[i]}
                onChange={(v) => {
                  const next = [...starLetters] as [MarkerLetter, MarkerLetter, MarkerLetter];
                  const duplicate = next.findIndex((letter, index) => index !== i && letter === v);
                  if (duplicate >= 0) next[duplicate] = next[i];
                  next[i] = v;
                  setStarLetters(next);
                }}
                options={MARKER_LETTERS.map((l) => ({ value: l, label: l }))}
                disabled={isSolved}
                size="sm"
                ariaLabel={`Maze letter ${i + 1}`}
              />
            </div>
          ))}
        </div>
      </SolverSection>

      <SolverSection
        title="Goal direction"
        description="Leave empty until the defuser has read it at a star — then pick N/S/E/W and solve again."
      >
        <SegmentedControl<string>
          value={goalDirection}
          onChange={(v) => setGoalDirection(v as GoalDirection | "")}
          options={[{ value: "", label: "Not yet" }, ...GOAL_DIRECTIONS]}
          disabled={isSolved}
          ariaLabel="Goal direction"
        />
      </SolverSection>

      <SolverSection
        title="Current position"
        description="Enter the optional floor symbol and the ordered distances to each wall. Compass orientation is inferred."
      >
        <div className="space-y-3">
          {currentRow != null && currentCol != null && currentFacing && (
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Tracking row {currentRow}, column {currentCol}, facing {directionLabel[currentFacing]}
            </p>
          )}
          <div className="flex items-center gap-2">
            <label htmlFor="letter-at-position" className="text-xs font-medium text-muted-foreground">
              Floor symbol (optional)
            </label>
            <select
              id="letter-at-position"
              value={letterAtPosition}
              onChange={(e) => setLetterAtPosition(e.target.value)}
              disabled={isSolved}
              className={cn(
                "h-9 min-w-[4rem] rounded-md border border-border bg-muted/40 px-2 text-sm text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                "disabled:opacity-70",
              )}
            >
              {LETTER_AT_POSITION_OPTIONS.map((opt) => (
                <option key={opt || "empty"} value={opt}>
                  {opt || "—"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Distances to wall</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  [0, "Front"],
                  [1, "Right"],
                  [2, "Behind"],
                  [3, "Left"],
                ] as const
              ).map(([i, label]) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={7}
                    className="w-14 text-center"
                    value={stepsToWall[i]}
                    onChange={(e) => {
                      const n = Math.max(0, Math.min(7, parseInt(e.target.value, 10) || 0));
                      const next: [number, number, number, number] = [...stepsToWall];
                      next[i] = n;
                      setStepsToWall(next);
                    }}
                    disabled={isSolved}
                    aria-label={label}
                  />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
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
          variant={result.phase === "go_to_star" ? "info" : "success"}
          title={result.phase === "go_to_star" ? "Go to a star first" : "Goal found"}
          description={
            result.phase === "go_to_star"
              ? (result.message ?? "Walk to one of the stars, then solve again with the reported direction.")
              : `Goal wall found at (${result.goalRow}, ${result.goalCol}); the final Forward is included.`
          }
        />
      )}

      {result && result.moves != null && result.moves.length > 0 && (
        <SolverSection
          title="Turn-by-turn moves"
          description={
            result.startRow != null && result.startCol != null && result.startFacing
              ? `From (${result.startRow}, ${result.startCol}) facing ${directionLabel[result.startFacing] ?? result.startFacing}`
              : undefined
          }
        >
          <div className="flex flex-wrap gap-1.5">
            {result.moves.map((move, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300"
              >
                {moveLabel(move)}
              </span>
            ))}
          </div>
        </SolverSection>
      )}

      {result?.maze && (
        <SolverSection
          title="Maze map"
          description="8×8 grid; rows and columns wrap around. Arrow = start, green tint = path, * = star, ✓ = goal."
        >
          <div
            id={mazeGridId}
            role="grid"
            aria-label="Maze grid, 8 by 8 cells"
            aria-describedby={mazeGridDescId}
            className="relative mx-auto inline-grid max-w-full overflow-auto rounded border border-border bg-muted/20"
            style={{
              gridTemplateColumns: "auto repeat(8, 1fr)",
              gridTemplateRows: "auto repeat(8, 1fr)",
            }}
          >
            <div className="h-9 w-9 min-h-[2.25rem] min-w-[2.25rem] bg-muted/40" aria-hidden />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
              <div
                key={`col-${c}`}
                className="flex h-9 w-9 min-h-[2.25rem] min-w-[2.25rem] items-center justify-center bg-muted/40 text-xs font-medium text-muted-foreground"
                aria-hidden
              >
                {c}
              </div>
            ))}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((row) => (
              <Fragment key={`row-${row}`}>
                <div
                  className="flex h-9 w-9 min-h-[2.25rem] min-w-[2.25rem] items-center justify-center bg-muted/40 text-xs font-medium text-muted-foreground"
                  aria-hidden
                >
                  {row}
                </div>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((col) =>
                  renderedMazeCells[row * SIZE + col]
                )}
              </Fragment>
            ))}
          </div>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Default rule seed only. Identify the maze from three distinct floor letters, enter the current
        observation, and solve. After reaching a marked direction cell, select N/S/E/W and solve again.
      </SolverInstructions>
    </SolverLayout>
  );
}
