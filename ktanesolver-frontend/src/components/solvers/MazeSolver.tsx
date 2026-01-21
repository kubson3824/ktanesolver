import { useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveMaze, type Cell, type Move } from "../../services/mazeService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import ModuleNumberInput from "../ModuleNumberInput";

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
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

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
    setError("");

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
        moduleNumber
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
    setIsSolved(false);
    setError("");
    setTwitchCommand("");
  };

  const clearCell = (row: number, col: number) => {
    if (isSolved) return;
    
    const cell = { row: row + 1, col: col + 1 };
    
    // Remove from markers
    setMarkers(markers.filter(m => m.row !== cell.row || m.col !== cell.col));
    
    // Clear start if matches
    if (startPos?.row === cell.row && startPos?.col === cell.col) {
      setStartPos(null);
    }
    
    // Clear target if matches
    if (targetPos?.row === cell.row && targetPos?.col === cell.col) {
      setTargetPos(null);
    }
  };

  const renderMaze = () => {
    const grid = [];

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        const isMarker = markers.some(m => m.row === row + 1 && m.col === col + 1);
        const isStart = startPos?.row === row + 1 && startPos?.col === col + 1;
        const isEnd = targetPos?.row === row + 1 && targetPos?.col === col + 1;
        const markerIndex = markers.findIndex(m => m.row === row + 1 && m.col === col + 1);
        
        grid.push(
          <div
            key={`${row}-${col}`}
            onClick={() => handleCellClick(row, col)}
            onContextMenu={(e) => {
              e.preventDefault();
              clearCell(row, col);
            }}
            className={`
              relative w-12 h-12 border border-gray-600 cursor-pointer hover:bg-gray-700
              ${!isMarker && !isStart && !isEnd ? 'bg-gray-800' : ''}
              ${isMarker ? 'bg-blue-900' : ''}
              ${isStart ? 'bg-green-600' : ''}
              ${isEnd ? 'bg-red-600' : ''}
              ${isSolved ? 'cursor-not-allowed opacity-75' : ''}
            `}
            role={isSolved ? undefined : "button"}
            tabIndex={isSolved ? -1 : 0}
            onKeyDown={(e) => {
              if (!isSolved && e.key === 'Enter') {
                handleCellClick(row, col);
              } else if (!isSolved && (e.key === 'Delete' || e.key === 'Backspace')) {
                clearCell(row, col);
              }
            }}
          >
            {isMarker && (
              <div className="absolute inset-0 flex items-center justify-center text-blue-300 font-bold text-xs">
                ⬤
                {markerIndex === 0 && <span className="absolute -top-1 -right-1 text-xs">1</span>}
                {markerIndex === 1 && <span className="absolute -top-1 -right-1 text-xs">2</span>}
              </div>
            )}
            {isStart && (
              <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            )}
            {isEnd && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-white"></div>
              </div>
            )}
          </div>
        );
      }
    }

    return grid;
  };

  const moveArrows: Record<Move, string> = {
    UP: "↑",
    DOWN: "↓",
    LEFT: "←",
    RIGHT: "→"
  };

  const modeConfig: Record<PlacementMode, { label: string; color: string; icon: string }> = {
    marker1: { label: "Marker 1", color: "bg-blue-600", icon: "⬤" },
    marker2: { label: "Marker 2", color: "bg-blue-600", icon: "⬤" },
    start: { label: "Start (White Light)", color: "bg-green-600", icon: "○" },
    target: { label: "Target (Red Triangle)", color: "bg-red-600", icon: "△" }
  };

  return (
    <div className="w-full">
      <ModuleNumberInput />
      {/* Maze visualization */}
      <div className="bg-gray-900 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">MAZE GRID</h3>
        <div className="grid grid-cols-6 gap-0 max-w-sm mx-auto border-2 border-gray-600">
          {renderMaze()}
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-900 border border-gray-600 flex items-center justify-center text-blue-300">⬤</div>
            <span className="text-gray-400">Markers</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-600 border border-gray-600 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="text-gray-400">Start</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-600 border border-gray-600 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[2px] border-l-transparent border-r-[2px] border-r-transparent border-b-[4px] border-b-white"></div>
            </div>
            <span className="text-gray-400">Target</span>
          </div>
        </div>
      </div>

      {/* Placement mode selector */}
      <div className="bg-base-200 rounded-lg p-4 mb-4">
        <h3 className="text-center text-base-content/70 mb-3 text-sm font-medium">
          PLACEMENT MODE
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(modeConfig).map(([mode, config]) => (
            <button
              key={mode}
              onClick={() => setPlacementMode(mode as PlacementMode)}
              disabled={isSolved}
              className={`
                px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2
                ${placementMode === mode
                  ? `${config.color} text-white`
                  : 'bg-base-300 text-base-content hover:bg-base-400'
                }
                ${isSolved ? 'cursor-not-allowed opacity-50' : ''}
              `}
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-base-content/60 mt-2 text-center">
          Left click to place, right click to remove
        </p>
      </div>

      {/* Current status */}
      <div className="bg-base-200 rounded-lg p-4 mb-4">
        <h3 className="text-center text-base-content/70 mb-3 text-sm font-medium">
          CURRENT STATUS
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-base-content/60">Markers: </span>
            <span className={markers.length === 2 ? "text-green-600" : "text-orange-600"}>
              {markers.length}/2 placed
            </span>
          </div>
          <div>
            <span className="text-base-content/60">Start: </span>
            <span className={startPos ? "text-green-600" : "text-orange-600"}>
              {startPos ? `(${startPos.row}, ${startPos.col})` : "Not placed"}
            </span>
          </div>
          <div>
            <span className="text-base-content/60">Target: </span>
            <span className={targetPos ? "text-green-600" : "text-orange-600"}>
              {targetPos ? `(${targetPos.row}, ${targetPos.col})` : "Not placed"}
            </span>
          </div>
        </div>
      </div>
        
      {/* Solution display */}
      {isSolved && result.length > 0 && (
        <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 mb-4">
          <h3 className="text-center text-green-400 mb-3 text-sm font-medium">SOLUTION PATH</h3>
          <div className="flex justify-center gap-1 flex-wrap">
            {result.map((move, index) => (
              <div key={index} className="bg-green-800/50 border border-green-600 rounded w-10 h-10 flex items-center justify-center">
                <span className="text-green-300 font-bold text-lg">{moveArrows[move]}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-green-400 text-xs mt-2">{result.length} moves</p>
        </div>
      )}

      {/* Twitch Command */}
      {twitchCommand && (
        <div className="bg-purple-900/20 border border-purple-500 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-purple-400 mb-1">Twitch Chat Command:</h4>
              <code className="text-lg font-mono text-purple-200">{twitchCommand}</code>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(twitchCommand);
              }}
              className="btn btn-sm btn-outline btn-purple"
              title="Copy to clipboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleSolve}
          className="btn btn-primary flex-1"
          disabled={isLoading || isSolved || markers.length !== 2 || !startPos || !targetPos}
        >
          {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
          {isLoading ? "Solving..." : "Solve"}
        </button>
        <button onClick={reset} className="btn btn-outline" disabled={isLoading}>
          Reset
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Select a placement mode and click on the grid to place items. Place 2 markers, the start position (white light), and target position (red triangle).</p>
        <p>Right-click any placed item to remove it. Press Solve to find the shortest path.</p>
      </div>
    </div>
  );
}
