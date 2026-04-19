import { useCallback, useMemo, useState, Fragment } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveMaze, type Cell, type Move } from "../../services/mazeService";
import { findMaze } from "../../services/mazeDefinitions";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  SegmentedControl,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { cn } from "../../lib/cn";

interface MazeSolverProps {
  bomb: BombEntity | null | undefined;
}

type PlacementMode = "marker1" | "marker2" | "start" | "target";

const MODE_OPTIONS = [
  { value: "marker1" as const, label: "Marker 1" },
  { value: "marker2" as const, label: "Marker 2" },
  { value: "start" as const, label: "Start" },
  { value: "target" as const, label: "Target" },
];

function ArrowIcon({ move, className = "h-5 w-5" }: { move: Move; className?: string }) {
  const path =
    move === "UP"
      ? "M12 4l-8 8h5v8h6v-8h5L12 4z"
      : move === "DOWN"
        ? "M12 20l8-8h-5V4h-6v8H4l8 8z"
        : move === "LEFT"
          ? "M4 12l8 8v-5h8v-6h-8V4L4 12z"
          : "M20 12l-8-8v5H4v6h8v5l8-8z";
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d={path} />
    </svg>
  );
}

export default function MazeSolver({ bomb }: MazeSolverProps) {
  const [markers, setMarkers] = useState<Cell[]>([]);
  const [startPos, setStartPos] = useState<Cell | null>(null);
  const [targetPos, setTargetPos] = useState<Cell | null>(null);
  const [placementMode, setPlacementMode] = useState<PlacementMode>("marker1");
  const [result, setResult] = useState<Move[]>([]);
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
    () => ({ markers, startPos, targetPos, placementMode, result, twitchCommand }),
    [markers, startPos, targetPos, placementMode, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      markers?: Cell[];
      startPos?: Cell | null;
      targetPos?: Cell | null;
      placementMode?: PlacementMode;
      result?: Move[];
      path?: Move[];
      twitchCommand?: string;
      input?: { marker1?: Cell; marker2?: Cell; start?: Cell; target?: Cell };
    }) => {
      if (state.markers && Array.isArray(state.markers)) setMarkers(state.markers);
      else if (state.input && (state.input.marker1 || state.input.marker2)) {
        const m1 = state.input.marker1;
        const m2 = state.input.marker2;
        if (m1 && m2) setMarkers([m1, m2]);
        else if (m1) setMarkers([m1]);
        else if (m2) setMarkers([m2]);
      }
      if (state.startPos !== undefined) setStartPos(state.startPos);
      else if (state.input?.start !== undefined) setStartPos(state.input.start);
      if (state.targetPos !== undefined) setTargetPos(state.targetPos);
      else if (state.input?.target !== undefined) setTargetPos(state.input.target);
      if (state.placementMode) setPlacementMode(state.placementMode);
      if (state.result && Array.isArray(state.result)) setResult(state.result);
      else if (state.path && Array.isArray(state.path)) setResult(state.path);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: { moves: Move[] }) => {
    if (!solution?.moves || !Array.isArray(solution.moves)) return;
    setResult(solution.moves);
    setTwitchCommand(
      generateTwitchCommand({
        moduleType: ModuleType.MAZES,
        result: { directions: solution.moves },
      }),
    );
  }, []);

  useSolverModulePersistence<
    {
      markers: Cell[];
      startPos: Cell | null;
      targetPos: Cell | null;
      placementMode: PlacementMode;
      result: Move[];
      twitchCommand: string;
    },
    { moves: Move[] }
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: { moves?: Move[] }; moves?: Move[]; path?: Move[] };
        const outputMoves =
          anyRaw.output &&
          typeof anyRaw.output === "object" &&
          Array.isArray(anyRaw.output.moves)
            ? anyRaw.output.moves
            : undefined;
        if (outputMoves) return { moves: outputMoves };
        if (Array.isArray(anyRaw.moves)) return { moves: anyRaw.moves };
        if (Array.isArray(anyRaw.path)) return { moves: anyRaw.path };
      }
      return null;
    },
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleCellClick = (row: number, col: number) => {
    if (isSolved) return;
    const cell = { row: row + 1, col: col + 1 };
    switch (placementMode) {
      case "marker1":
        if (markers.length >= 2) setMarkers([cell, markers[1]]);
        else if (markers.length === 1) setMarkers([...markers, cell]);
        else setMarkers([cell]);
        break;
      case "marker2":
        if (markers.length >= 2) setMarkers([markers[0], cell]);
        else if (markers.length === 1) setMarkers([...markers, cell]);
        else setMarkers([cell]);
        break;
      case "start":
        setStartPos(cell);
        break;
      case "target":
        setTargetPos(cell);
        break;
    }
  };

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }
    if (markers.length !== 2) {
      setError("Place both markers.");
      return;
    }
    if (!startPos || !targetPos) {
      setError("Place the start (white light) and target (red triangle).");
      return;
    }

    setIsLoading(true);
    clearError();
    try {
      const response = await solveMaze(round.id, bomb.id, currentModule.id, {
        input: {
          marker1: markers[0],
          marker2: markers[1],
          start: startPos,
          target: targetPos,
        },
      });
      setResult(response.output.moves);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.MAZES,
          result: { directions: response.output.moves },
        }),
      );
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve maze");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setMarkers([]);
    setStartPos(null);
    setTargetPos(null);
    setResult([]);
    setTwitchCommand("");
    resetSolverState();
  };

  const clearCell = (row: number, col: number) => {
    if (isSolved) return;
    const cell = { row: row + 1, col: col + 1 };
    setMarkers(markers.filter((m) => m.row !== cell.row || m.col !== cell.col));
    if (startPos?.row === cell.row && startPos?.col === cell.col) setStartPos(null);
    if (targetPos?.row === cell.row && targetPos?.col === cell.col) setTargetPos(null);
  };

  const applyMove = (c: Cell, move: Move): Cell => {
    switch (move) {
      case "UP":
        return c.row > 1 ? { row: c.row - 1, col: c.col } : c;
      case "DOWN":
        return c.row < 6 ? { row: c.row + 1, col: c.col } : c;
      case "LEFT":
        return c.col > 1 ? { row: c.row, col: c.col - 1 } : c;
      case "RIGHT":
        return c.col < 6 ? { row: c.row, col: c.col + 1 } : c;
    }
  };

  const pathCells = useMemo(() => {
    if (!startPos || !result.length) return [];
    const cells: Cell[] = [startPos];
    let cur = startPos;
    for (const move of result) {
      cur = applyMove(cur, move);
      cells.push(cur);
    }
    return cells;
  }, [startPos, result]);

  const pathStepByCell = useMemo(() => {
    const map = new Map<string, { stepIndex: number; outgoingMove?: Move }>();
    pathCells.forEach((cell, stepIndex) => {
      const key = `${cell.row},${cell.col}`;
      const outgoingMove = stepIndex < result.length ? result[stepIndex] : undefined;
      map.set(key, { stepIndex, outgoingMove });
    });
    return map;
  }, [pathCells, result]);

  const solvedMaze = useMemo(() => {
    if (!isSolved || markers.length !== 2) return null;
    return findMaze(markers[0], markers[1]);
  }, [isSolved, markers]);

  const renderCell = (row: number, col: number) => {
    const r = row + 1,
      c = col + 1;
    const markerIndex = markers.findIndex((m) => m.row === r && m.col === c);
    const isMarker = markerIndex >= 0;
    const isStart = startPos?.row === r && startPos?.col === c;
    const isEnd = targetPos?.row === r && targetPos?.col === c;
    const pathStep = pathStepByCell.get(`${r},${c}`);
    const isOnPath = pathStep !== undefined;

    const hasRightWall = solvedMaze && col < 5 && solvedMaze.verticalWalls[row][col];
    const hasBottomWall = solvedMaze && row < 5 && solvedMaze.horizontalWalls[row][col];
    const hasLeftWall = solvedMaze && col > 0 && solvedMaze.verticalWalls[row][col - 1];
    const hasTopWall = solvedMaze && row > 0 && solvedMaze.horizontalWalls[row - 1][col];

    const symbols: React.ReactNode[] = [];
    if (isStart) {
      symbols.push(
        <div
          key="start"
          className="h-3.5 w-3.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
        />,
      );
    }
    if (isEnd) {
      symbols.push(
        <svg
          key="target"
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-red-500"
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 2L2 22h20L12 2z" />
        </svg>,
      );
    }
    if (isOnPath && !isEnd && pathStep?.outgoingMove != null) {
      symbols.push(
        <span key="arrow" className="shrink-0 text-emerald-500">
          <ArrowIcon move={pathStep.outgoingMove} className="h-4 w-4" />
        </span>,
      );
    }
    if (isMarker) {
      symbols.push(
        <span
          key="marker"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-blue-500 bg-card text-[10px] font-bold text-blue-600 dark:text-blue-400 shadow"
        >
          {markerIndex + 1}
        </span>,
      );
    }

    return (
      <div
        key={`${row}-${col}`}
        role="gridcell"
        aria-rowindex={r}
        aria-colindex={c}
        aria-label={
          isMarker
            ? `Marker ${markerIndex + 1}, row ${r}, column ${c}`
            : isStart
              ? `Start, row ${r}, column ${c}`
              : isEnd
                ? `Target, row ${r}, column ${c}`
                : isOnPath
                  ? `Path step ${(pathStep?.stepIndex ?? 0) + 1}, row ${r}, column ${c}`
                  : `Cell row ${r}, column ${c}`
        }
        onClick={() => handleCellClick(row, col)}
        onContextMenu={(e) => {
          e.preventDefault();
          clearCell(row, col);
        }}
        tabIndex={isSolved ? -1 : 0}
        onKeyDown={(e) => {
          if (!isSolved && e.key === "Enter") handleCellClick(row, col);
          else if (!isSolved && (e.key === "Delete" || e.key === "Backspace"))
            clearCell(row, col);
        }}
        className={cn(
          "relative flex h-12 w-12 cursor-pointer items-center justify-center border border-border/60 transition-colors",
          !isMarker && !isStart && !isEnd && !isOnPath && "bg-muted/40 hover:bg-muted",
          isMarker && "bg-blue-500/10",
          isStart && "bg-emerald-500/15",
          isEnd && "bg-red-500/15",
          isOnPath && !isStart && !isEnd && "bg-emerald-500/10",
          isSolved && "cursor-not-allowed opacity-80",
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
          <div className="relative flex items-center justify-center gap-0.5">{symbols}</div>
        )}
      </div>
    );
  };

  const cells: React.ReactNode[][] = [];
  for (let row = 0; row < 6; row++) {
    cells[row] = [];
    for (let col = 0; col < 6; col++) cells[row].push(renderCell(row, col));
  }

  return (
    <SolverLayout>
      <SolverSection
        title="Placement mode"
        description="Select what you're placing, then click a cell. Right-click any cell to clear it."
      >
        <SegmentedControl
          value={placementMode}
          onChange={(v) => setPlacementMode(v as PlacementMode)}
          options={MODE_OPTIONS}
          size="sm"
          ariaLabel="Placement mode"
          disabled={isSolved}
          className="w-full justify-center"
        />
      </SolverSection>

      <SolverSection
        title="Maze grid (6 × 6)"
        description="Place two circular markers, the white start light, and the red triangle target."
      >
        <div
          role="grid"
          aria-label="Maze grid, 6 by 6"
          className="mx-auto inline-grid overflow-hidden rounded-md border border-border bg-muted/30"
          style={{
            gridTemplateColumns: "auto repeat(6, 1fr)",
            gridTemplateRows: "auto repeat(6, 1fr)",
          }}
        >
          <div className="h-7 w-7 bg-muted" aria-hidden />
          {[1, 2, 3, 4, 5, 6].map((c) => (
            <div
              key={`col-${c}`}
              className="flex h-7 w-12 items-center justify-center bg-muted text-xs font-medium text-muted-foreground"
              aria-hidden
            >
              {c}
            </div>
          ))}
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <Fragment key={`row-${row}`}>
              <div
                className="flex h-12 w-7 items-center justify-center bg-muted text-xs font-medium text-muted-foreground"
                aria-hidden
              >
                {row + 1}
              </div>
              {cells[row]}
            </Fragment>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-blue-500 bg-card text-[9px] font-bold text-blue-600 dark:text-blue-400">
              1
            </span>
            Marker
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.7)]" />
            Start
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-red-500" fill="currentColor" aria-hidden>
              <path d="M12 2L2 22h20L12 2z" />
            </svg>
            Target
          </span>
        </div>
      </SolverSection>

      <SolverSection
        title="Status"
        contentClassName="grid grid-cols-3 gap-3 text-xs"
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Markers
          </span>
          <span
            className={cn(
              "mt-0.5 text-sm font-medium",
              markers.length === 2 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
            )}
          >
            {markers.length}/2
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Start
          </span>
          <span
            className={cn(
              "mt-0.5 text-sm font-medium",
              startPos ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
            )}
          >
            {startPos ? `(${startPos.row}, ${startPos.col})` : "not set"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Target
          </span>
          <span
            className={cn(
              "mt-0.5 text-sm font-medium",
              targetPos ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
            )}
          >
            {targetPos ? `(${targetPos.row}, ${targetPos.col})` : "not set"}
          </span>
        </div>
      </SolverSection>

      {isSolved && result.length > 0 && (
        <SolverSection
          title="Solution path"
          description={`${result.length} moves.`}
          className="border-emerald-500/40"
        >
          <div className="flex flex-wrap justify-center gap-1.5">
            {result.map((move, index) => (
              <div
                key={index}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              >
                <ArrowIcon move={move} className="h-6 w-6" />
              </div>
            ))}
          </div>
        </SolverSection>
      )}

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={markers.length !== 2 || !startPos || !targetPos}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />
      <TwitchCommandDisplay command={twitchCommand} />

      <SolverInstructions>
        Pick a placement mode, click to place, right-click to clear. Once both
        markers, the start, and the target are placed, Solve computes the
        shortest path. Arrows on the grid show each step in order.
      </SolverInstructions>
    </SolverLayout>
  );
}
