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
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls
} from "../common";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/cn";

interface MazeSolverProps {
  bomb: BombEntity | null | undefined;
}

type PlacementMode = 'marker1' | 'marker2' | 'start' | 'target';

export default function MazeSolver({ bomb }: MazeSolverProps) {
  const [markers, setMarkers] = useState<Cell[]>([]);
  const [startPos, setStartPos] = useState<Cell | null>(null);
  const [targetPos, setTargetPos] = useState<Cell | null>(null);
  const [placementMode, setPlacementMode] = useState<PlacementMode>('marker1');
  const [result, setResult] = useState<Move[]>([]);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

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
      // Frontend shape
      if (state.markers && Array.isArray(state.markers)) {
        setMarkers(state.markers);
      } else if (state.input && (state.input.marker1 || state.input.marker2)) {
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

  const onRestoreSolution = useCallback(
    (solution: { moves: Move[] }) => {
      if (!solution?.moves || !Array.isArray(solution.moves)) return;
      setResult(solution.moves);

      const command = generateTwitchCommand({
        moduleType: ModuleType.MAZES,
        result: { directions: solution.moves },
      });
      setTwitchCommand(command);
    },
  []);

  useSolverModulePersistence<
    { markers: Cell[]; startPos: Cell | null; targetPos: Cell | null; placementMode: PlacementMode; result: Move[]; twitchCommand: string },
    { moves: Move[] }
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: { moves?: Move[] }; moves?: Move[]; path?: Move[] };
        const fromOutput = anyRaw.output && typeof anyRaw.output === "object" && Array.isArray(anyRaw.output.moves);
        if (fromOutput) return { moves: anyRaw.output.moves };
        if (Array.isArray(anyRaw.moves)) return { moves: anyRaw.moves };
        if (Array.isArray(anyRaw.path)) return { moves: anyRaw.path };
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleCellClick = (row: number, col: number) => {
    if (isSolved) return;
    
    const cell = { row: row + 1, col: col + 1 }; // Convert to 1-indexed
    
    switch (placementMode) {
      case 'marker1':
        if (markers.length >= 2) {
          setMarkers([cell, markers[1]]);
        } else if (markers.length === 1) {
          setMarkers([...markers, cell]);
        } else {
          setMarkers([cell]);
        }
        break;
      case 'marker2':
        if (markers.length >= 2) {
          setMarkers([markers[0], cell]);
        } else if (markers.length === 1) {
          setMarkers([...markers, cell]);
        } else {
          setMarkers([cell]);
        }
        break;
      case 'start':
        setStartPos(cell);
        break;
      case 'target':
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
      setError("Please place exactly 2 markers");
      return;
    }

    if (!startPos || !targetPos) {
      setError("Please place both start (white light) and target (red triangle) positions");
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
          target: targetPos
        }
      });

      setResult(response.output.moves);
      
      // Generate Twitch command
      const command = generateTwitchCommand({
        moduleType: ModuleType.MAZES,
        result: { directions: response.output.moves },
      });
      setTwitchCommand(command);
      
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
    setMarkers(markers.filter(m => m.row !== cell.row || m.col !== cell.col));
    if (startPos?.row === cell.row && startPos?.col === cell.col) setStartPos(null);
    if (targetPos?.row === cell.row && targetPos?.col === cell.col) setTargetPos(null);
  };

  const applyMove = (c: Cell, move: Move): Cell => {
    switch (move) {
      case "UP": return c.row > 1 ? { row: c.row - 1, col: c.col } : c;
      case "DOWN": return c.row < 6 ? { row: c.row + 1, col: c.col } : c;
      case "LEFT": return c.col > 1 ? { row: c.row, col: c.col - 1 } : c;
      case "RIGHT": return c.col < 6 ? { row: c.row, col: c.col + 1 } : c;
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

  const renderMaze = () => {
    const grid = [];

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        const r = row + 1, c = col + 1;
        const isMarker = markers.some(m => m.row === r && m.col === c);
        const isStart = startPos?.row === r && startPos?.col === c;
        const isEnd = targetPos?.row === r && targetPos?.col === c;
        const markerIndex = markers.findIndex(m => m.row === r && m.col === c);
        const pathStep = pathStepByCell.get(`${r},${c}`);
        const isOnPath = pathStep !== undefined;

        const hasRightWall = solvedMaze && col < 5 && solvedMaze.verticalWalls[row][col];
        const hasBottomWall = solvedMaze && row < 5 && solvedMaze.horizontalWalls[row][col];
        const hasLeftWall = solvedMaze && col > 0 && solvedMaze.verticalWalls[row][col - 1];
        const hasTopWall = solvedMaze && row > 0 && solvedMaze.horizontalWalls[row - 1][col];

        const symbols: React.ReactNode[] = [];
        if (isStart) {
          symbols.push(
            <div key="start" className="h-4 w-4 shrink-0 rounded-full bg-success-content shadow-[0_0_8px_rgba(91,231,169,0.6)]" />
          );
        }
        if (isEnd) {
          symbols.push(
            <svg key="target" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-error-content" fill="currentColor" aria-hidden>
              <path d="M12 2L2 22h20L12 2z" />
            </svg>
          );
        }
        if (isOnPath && !isEnd && pathStep?.outgoingMove != null) {
          symbols.push(
            <span key="arrow" className="shrink-0 text-success/90">
              <ArrowIcon move={pathStep.outgoingMove} className="h-5 w-5" />
            </span>
          );
        }
        if (isMarker) {
          symbols.push(
            <span
              key="marker"
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 font-bold text-xs",
                "border-info bg-base-100 text-base-content shadow-md"
              )}
            >
              {markerIndex + 1}
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
            className={cn(
              "relative min-w-[3rem] min-h-[3rem] w-14 h-14 cursor-pointer transition-colors",
              "border border-base-content/25",
              !isMarker && !isStart && !isEnd && !isOnPath && "bg-base-300 hover:bg-base-400",
              isMarker && "bg-info/30 border-info/50",
              isStart && "bg-success/40 border-success/50",
              isEnd && "bg-error/40 border-error/50",
              isOnPath && !isStart && !isEnd && "bg-success/25 border-success/40",
              isSolved && "cursor-not-allowed opacity-75"
            )}
            tabIndex={isSolved ? -1 : 0}
            onKeyDown={(e) => {
              if (!isSolved && e.key === "Enter") {
                handleCellClick(row, col);
              } else if (!isSolved && (e.key === "Delete" || e.key === "Backspace")) {
                clearCell(row, col);
              }
            }}
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
              <div className="absolute inset-0 flex flex-row items-center justify-center gap-1">
                {symbols}
              </div>
            )}
          </div>
        );
      }
    }
    return grid;
  };

  const ArrowIcon = ({ move, className = "h-6 w-6" }: { move: Move; className?: string }) => {
    const path = move === "UP" ? "M12 4l-8 8h5v8h6v-8h5L12 4z"
      : move === "DOWN" ? "M12 20l8-8h-5V4h-6v8H4l8 8z"
      : move === "LEFT" ? "M4 12l8 8v-5h8v-6h-8V4L4 12z"
      : "M20 12l-8-8v5H4v6h8v5l8-8z";
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d={path} />
      </svg>
    );
  };

  const modeConfig: Record<PlacementMode, { label: string; shortLabel: string; activeClass: string }> = {
    marker1: { label: "Marker 1", shortLabel: "M1", activeClass: "bg-info text-info-content" },
    marker2: { label: "Marker 2", shortLabel: "M2", activeClass: "bg-info text-info-content" },
    start: { label: "Start (White Light)", shortLabel: "Start", activeClass: "bg-success text-success-content" },
    target: { label: "Target (Red Triangle)", shortLabel: "Target", activeClass: "bg-error text-error-content" }
  };

  const gridId = "maze-grid";
  const gridDescriptionId = "maze-grid-desc";

  return (
    <SolverLayout>
      {/* Maze grid card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-center">Maze grid</CardTitle>
          <CardDescription id={gridDescriptionId} className="text-center">
            Place two markers, start (white light), and target (red triangle). Left click to place, right click to remove.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            id={gridId}
            role="grid"
            aria-label="Maze grid, 6 by 6 cells"
            aria-describedby={gridDescriptionId}
            className="relative inline-grid max-w-sm mx-auto border-2 border-base-content/40 rounded overflow-hidden bg-base-content/10"
            style={{ gridTemplateColumns: "auto repeat(6, 1fr)", gridTemplateRows: "auto repeat(6, 1fr)" }}
          >
            {/* Corner */}
            <div className="min-w-[1.5rem] min-h-[1.5rem] w-8 h-8 bg-base-300" aria-hidden />
            {/* Column labels 1-6 */}
            {[1, 2, 3, 4, 5, 6].map((c) => (
              <div
                key={`col-${c}`}
                className="min-w-[3rem] min-h-[1.5rem] w-14 h-8 flex items-center justify-center bg-base-300 text-xs text-base-content/70 font-medium"
                aria-hidden
              >
                {c}
              </div>
            ))}
            {/* Row labels and cells */}
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <Fragment key={`row-${row}`}>
                <div
                  className="min-w-[1.5rem] min-h-[3rem] w-8 h-14 flex items-center justify-center bg-base-300 text-xs text-base-content/70 font-medium"
                  aria-hidden
                >
                  {row + 1}
                </div>
                {[0, 1, 2, 3, 4, 5].map((col) => renderMaze()[row * 6 + col])}
              </Fragment>
            ))}
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-info bg-info/30 text-info font-bold text-[10px]">1</span>
              <span className="text-base-content/70">Marker 1</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-info bg-info/30 text-info font-bold text-[10px]">2</span>
              <span className="text-base-content/70">Marker 2</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-success-content shadow-[0_0_4px_rgba(91,231,169,0.5)]" />
              <span className="text-base-content/70">Start</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-error" fill="currentColor" aria-hidden>
                <path d="M12 2L2 22h20L12 2z" />
              </svg>
              <span className="text-base-content/70">Target</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placement mode */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-center">Placement mode</CardTitle>
          <CardDescription className="text-center">
            Left click to place, right click to remove.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Placement mode">
            {(Object.entries(modeConfig) as [PlacementMode, typeof modeConfig[PlacementMode]][]).map(([mode, config]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPlacementMode(mode)}
                disabled={isSolved}
                aria-pressed={placementMode === mode}
                aria-label={`Place ${config.label}`}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  placementMode === mode ? config.activeClass : "bg-base-300 text-base-content hover:bg-base-400",
                  isSolved && "cursor-not-allowed opacity-50"
                )}
              >
                {config.shortLabel}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-center">Current status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-base-content/60 text-xs">Markers</span>
              <span className={cn("font-medium", markers.length === 2 ? "text-success" : "text-warning")}>
                {markers.length}/2 placed
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-base-content/60 text-xs">Start</span>
              <span className={cn("font-medium", startPos ? "text-success" : "text-warning")}>
                {startPos ? `(${startPos.row}, ${startPos.col})` : "Not placed"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-base-content/60 text-xs">Target</span>
              <span className={cn("font-medium", targetPos ? "text-success" : "text-warning")}>
                {targetPos ? `(${targetPos.row}, ${targetPos.col})` : "Not placed"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Solution */}
      {isSolved && result.length > 0 && (
        <Card className="mb-4 border-success/50 bg-success/5">
          <CardHeader>
            <CardTitle className="text-center text-success">Solution path</CardTitle>
            <CardDescription className="text-center">
              {result.length} moves.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {result.map((move, index) => (
                <div
                  key={index}
                  className="flex h-11 w-11 items-center justify-center rounded border border-success/50 bg-success/20 text-success"
                >
                  <ArrowIcon move={move} className="h-7 w-7" />
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-center">
              <span className="text-sm text-base-content/70">{result.length} moves</span>
            </div>
          </CardContent>
        </Card>
      )}

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={markers.length !== 2 || !startPos || !targetPos}
        isLoading={isLoading}
        solveText="Solve"
      />

      <ErrorAlert error={error} />
      <TwitchCommandDisplay command={twitchCommand} />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-base-content/80">How to use</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-base-content/70">
            Select a placement mode (Marker 1, Marker 2, Start, or Target) and click a cell to place. Place exactly 2 markers, the start position (white light), and the target position (red triangle). Right-click any placed item to remove it, then press Solve to get the shortest path.
          </p>
        </CardContent>
      </Card>
    </SolverLayout>
  );
}
