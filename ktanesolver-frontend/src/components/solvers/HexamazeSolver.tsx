import { useCallback, useMemo, useState } from "react";
import {
  solveHexamaze,
  type HexamazeColor,
  type HexamazeInput,
  type HexamazeMarking,
  type HexamazeOutput,
} from "../../services/hexamazeService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SegmentedControl,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";
import { cn } from "../../lib/cn";

type Tool = HexamazeMarking | "PAWN";
type Cell = { q: number; r: number };

const TOOLS: { value: Tool; label: string }[] = [
  { value: "PAWN", label: "Pawn" },
  { value: "CIRCLE", label: "Circle" },
  { value: "TRIANGLE_UP", label: "▲" },
  { value: "TRIANGLE_DOWN", label: "▼" },
  { value: "TRIANGLE_LEFT", label: "◀" },
  { value: "TRIANGLE_RIGHT", label: "▶" },
  { value: "HEXAGON", label: "Hexagon" },
];
const COLORS: { value: HexamazeColor; label: string }[] = [
  { value: "RED", label: "Red" }, { value: "YELLOW", label: "Yellow" },
  { value: "GREEN", label: "Green" }, { value: "CYAN", label: "Cyan" },
  { value: "BLUE", label: "Blue" }, { value: "PINK", label: "Pink" },
];
const COLOR_HEX: Record<HexamazeColor, string> = {
  RED: "#ef4444", YELLOW: "#eab308", GREEN: "#22c55e",
  CYAN: "#06b6d4", BLUE: "#3b82f6", PINK: "#ec4899",
};
const CELLS: Cell[] = Array.from({ length: 7 }, (_, r) => r - 3).flatMap((r) =>
  Array.from({ length: 7 }, (_, q) => q - 3)
    .filter((q) => Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r)) < 4)
    .map((q) => ({ q, r })),
);
const key = ({ q, r }: Cell) => `${q},${r}`;

// Flat-top hex geometry in SVG units. Direction indices 0-5 = NW,N,NE,SE,S,SW (backend order).
const S = 10;
const CORNERS = Array.from({ length: 6 }, (_, i) => ({
  x: S * Math.cos((Math.PI * i) / 3),
  y: S * Math.sin((Math.PI * i) / 3),
}));
const hexCenter = ({ q, r }: Cell) => ({ x: 1.5 * S * q, y: Math.sqrt(3) * S * (q / 2 + r) });
const hexPoints = (x: number, y: number, scale = 1) =>
  CORNERS.map((corner) => `${x + corner.x * scale},${y + corner.y * scale}`).join(" ");
const DIRS = ["NW", "N", "NE", "SE", "S", "SW"];
const DELTAS = [[-1, 0], [0, -1], [1, -1], [1, 0], [0, 1], [-1, 1]];
// Outline of the whole board (pointy-top hexagon); side e is the exit edge crossed by moving in direction e.
const R = 65;
const EXIT_W = (Math.sqrt(3) / 2) * R;
const EXIT_CORNERS: [number, number][] = [
  [-EXIT_W, -R / 2], [0, -R], [EXIT_W, -R / 2], [EXIT_W, R / 2], [0, R], [-EXIT_W, R / 2],
];

function MarkShape({ marking }: { marking: HexamazeMarking }) {
  if (marking === "CIRCLE") return <circle r={4.2} fill="none" stroke="currentColor" strokeWidth={1.6} />;
  if (marking === "HEXAGON") return <polygon points={hexPoints(0, 0, 0.48)} fill="none" stroke="currentColor" strokeWidth={1.6} />;
  const points = {
    TRIANGLE_UP: "0,-4.5 4.2,3 -4.2,3",
    TRIANGLE_DOWN: "0,4.5 4.2,-3 -4.2,-3",
    TRIANGLE_LEFT: "-4.5,0 3,4.2 3,-4.2",
    TRIANGLE_RIGHT: "4.5,0 -3,4.2 -3,-4.2",
  }[marking];
  return <polygon points={points} fill="currentColor" />;
}

export default function HexamazeSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [tool, setTool] = useState<Tool>("PAWN");
  const [markings, setMarkings] = useState<Record<string, HexamazeMarking>>({});
  const [pawn, setPawn] = useState<Cell | null>(null);
  const [pawnColor, setPawnColor] = useState<HexamazeColor>("RED");
  const [result, setResult] = useState<HexamazeOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ markings, pawn, pawnColor, result, twitchCommand }),
    [markings, pawn, pawnColor, result, twitchCommand],
  );

  const restore = useCallback((state: Partial<typeof moduleState> & { input?: Partial<HexamazeInput> }) => {
    const input = state.input;
    if (state.markings ?? input?.markings) setMarkings((state.markings ?? input?.markings)!);
    if (state.pawn) setPawn(state.pawn);
    else if (input?.pawnQ !== undefined && input.pawnR !== undefined) setPawn({ q: input.pawnQ, r: input.pawnR });
    if (state.pawnColor ?? input?.pawnColor) setPawnColor((state.pawnColor ?? input?.pawnColor)!);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);
  const restoreSolution = useCallback((solution: HexamazeOutput) => {
    if (!solution?.moves) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.HEXAMAZE, result: solution }));
  }, []);

  useSolverModulePersistence<typeof moduleState, HexamazeOutput>({
    state: moduleState,
    onRestoreState: restore,
    onRestoreSolution: restoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as HexamazeOutput & { output?: HexamazeOutput };
      return value.output ?? (value.moves ? value : null);
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solvedView = useMemo(() => {
    if (!result) return null;
    const rot = ((result.clockwiseRotation / 60) % 6 + 6) % 6;
    const walls = (result.walls ?? []).map((wall) => wall.split(",").map(Number) as [number, number, number]);
    // Screen edge e shows the color that sits at global edge (e - rot); the pawn color's edge is the exit.
    const edgeColors = Array.from({ length: 6 }, (_, e) => COLORS[(e - rot + 6) % 6].value);
    const exitEdge = (COLORS.findIndex((color) => color.value === pawnColor) + rot) % 6;
    const path: { x: number; y: number }[] = [];
    if (pawn) {
      let current = pawn;
      path.push(hexCenter(current));
      for (const move of result.moves) {
        const dir = DIRS.indexOf(move);
        if (dir < 0) break;
        current = { q: current.q + DELTAS[dir][0], r: current.r + DELTAS[dir][1] };
        path.push(hexCenter(current));
      }
      // The final move exits the board — end the line on the boundary instead of the phantom cell.
      if (path.length > 1) {
        const last = path[path.length - 1];
        const prev = path[path.length - 2];
        path[path.length - 1] = { x: (last.x + prev.x) / 2, y: (last.y + prev.y) / 2 };
      }
    }
    return { walls, edgeColors, exitEdge, path };
  }, [result, pawn, pawnColor]);

  const place = (cell: Cell) => {
    if (isSolved) return;
    clearError();
    const cellKey = key(cell);
    if (tool === "PAWN") {
      setPawn(cell);
      setMarkings((old) => Object.fromEntries(Object.entries(old).filter(([k]) => k !== cellKey)));
    } else if (pawn && key(pawn) === cellKey) {
      setError("The pawn cell cannot also contain a marking");
    } else {
      setMarkings((old) => {
        const next = { ...old };
        if (next[cellKey] === tool) delete next[cellKey]; else next[cellKey] = tool;
        return next;
      });
    }
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!pawn) return setError("Place the pawn on the grid");
    if (!Object.keys(markings).length) return setError("Enter every marking shown on the module");
    clearError();
    setIsLoading(true);
    try {
      const input: HexamazeInput = { markings, pawnQ: pawn.q, pawnR: pawn.r, pawnColor };
      const response = await solveHexamaze(round.id, bomb.id, currentModule.id, input);
      if (!response.output) return setError(response.reason ?? "Failed to solve Hexamaze");
      const command = generateTwitchCommand({ moduleType: ModuleType.HEXAMAZE, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, pawn, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Hexamaze");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, markings, pawn, pawnColor, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setTool("PAWN"); setMarkings({}); setPawn(null); setPawnColor("RED");
    setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return (
    <SolverLayout>
      <SolverSection title="Displayed hexagon" description="Choose the pawn or a marking, then click its cell. Click the same marking again to remove it.">
        <div className="space-y-4">
          <SegmentedControl value={tool} onChange={setTool} options={TOOLS} disabled={isSolved} ariaLabel="Placement tool" size="sm" className="w-full flex-wrap justify-center" />
          <svg viewBox="-78 -78 156 156" className="mx-auto block w-full max-w-md" role="grid" aria-label="Hexamaze cells">
            {solvedView && (
              <g pointerEvents="none" strokeLinecap="round">
                {solvedView.edgeColors.map((color, edge) => {
                  const [ax, ay] = EXIT_CORNERS[edge];
                  const [bx, by] = EXIT_CORNERS[(edge + 1) % 6];
                  const isExit = edge === solvedView.exitEdge;
                  return (
                    <g key={edge} opacity={isExit ? 1 : 0.45}>
                      <line x1={ax} y1={ay} x2={bx} y2={by} stroke={COLOR_HEX[color]} strokeWidth={isExit ? 5 : 2.5} />
                      {isExit && (
                        <text x={((ax + bx) / 2) * 1.16} y={((ay + by) / 2) * 1.16} textAnchor="middle" dominantBaseline="middle" fontSize={7} fontWeight={700} fill={COLOR_HEX[color]}>
                          EXIT
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            )}
            {CELLS.map((cell) => {
              const cellKey = key(cell);
              const marking = markings[cellKey];
              const hasPawn = pawn && key(pawn) === cellKey;
              const { x, y } = hexCenter(cell);
              return (
                <g key={cellKey}>
                  <polygon
                    role="gridcell"
                    aria-label={`Cell ${cell.q}, ${cell.r}${hasPawn ? `, ${pawnColor.toLowerCase()} pawn` : marking ? `, ${marking.toLowerCase().replaceAll("_", " ")}` : ""}`}
                    tabIndex={isSolved ? -1 : 0}
                    onClick={() => place(cell)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); place(cell); }
                    }}
                    points={hexPoints(x, y)}
                    strokeWidth={0.75}
                    className={cn("outline-none focus-visible:stroke-ring focus-visible:stroke-2 fill-muted/40 stroke-border", !isSolved && "cursor-pointer hover:fill-accent")}
                  />
                  {marking && (
                    <g transform={`translate(${x} ${y})`} className="pointer-events-none text-foreground" aria-hidden>
                      <MarkShape marking={marking} />
                    </g>
                  )}
                </g>
              );
            })}
            {solvedView && (
              <g pointerEvents="none" className="text-foreground" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                {solvedView.walls.map(([q, r, dir], index) => {
                  const { x, y } = hexCenter({ q, r });
                  const a = CORNERS[(dir + 3) % 6];
                  const b = CORNERS[(dir + 4) % 6];
                  return <line key={index} x1={x + a.x} y1={y + a.y} x2={x + b.x} y2={y + b.y} />;
                })}
              </g>
            )}
            {solvedView && solvedView.path.length > 1 && (
              <g pointerEvents="none">
                <marker id="hexamaze-arrow" viewBox="0 0 10 10" refX={7} refY={5} markerWidth={4.5} markerHeight={4.5} orient="auto">
                  <path d="M0,0L10,5L0,10z" fill={COLOR_HEX[pawnColor]} />
                </marker>
                <polyline
                  points={solvedView.path.map((point) => `${point.x},${point.y}`).join(" ")}
                  fill="none" stroke={COLOR_HEX[pawnColor]} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
                  opacity={0.9} markerEnd="url(#hexamaze-arrow)"
                />
              </g>
            )}
            {pawn && (
              <circle
                cx={hexCenter(pawn).x} cy={hexCenter(pawn).y} r={4.6}
                fill={COLOR_HEX[pawnColor]} stroke="currentColor" strokeWidth={1.4}
                className="pointer-events-none text-foreground"
              />
            )}
          </svg>
        </div>
      </SolverSection>

      <SolverSection title="Pawn color" description="The color determines which side of the large maze is the correct exit.">
        <SegmentedControl value={pawnColor} onChange={setPawnColor} options={COLORS} disabled={isSolved} ariaLabel="Pawn color" size="sm" className="w-full flex-wrap justify-center" />
      </SolverSection>

      <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!pawn || !Object.keys(markings).length} />
      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Move in order" description={`Matched at ${result.clockwiseRotation}° clockwise rotation — exit through the highlighted ${pawnColor.toLowerCase()} wall.`} className="border-emerald-500/40">
          <div className="flex flex-wrap justify-center gap-2">
            {result.moves.map((move, index) => <span key={index} className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-bold text-emerald-700 dark:text-emerald-300">{move}</span>)}
          </div>
        </SolverSection>
      )}
      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>Enter every visible marking with its orientation, place the pawn, then follow the six-direction path without crossing a wall.</SolverInstructions>
    </SolverLayout>
  );
}
