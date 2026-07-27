import { useMemo, useState } from "react";

import {
  solveLegos,
  type LegoColor,
  type LegoConnection,
  type LegoSize,
  type LegosOutput,
} from "../../services/legosService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  useSolver, useSolverModulePersistence,
} from "../common";
import { Button } from "../ui/button";

const COLORS: LegoColor[] = ["RED", "GREEN", "BLUE", "CYAN", "MAGENTA", "YELLOW"];
const SIZES: LegoSize[] = ["2×2", "3×1", "3×2", "4×1", "4×2"];
const CSS_COLORS: Record<LegoColor | "EMPTY", string> = {
  EMPTY: "#f9fafb", RED: "#dc2626", GREEN: "#16a34a", BLUE: "#2563eb",
  CYAN: "#06b6d4", MAGENTA: "#d946ef", YELLOW: "#facc15",
};
type PieceState = Record<LegoColor, { size: LegoSize; rotated: boolean }>;
const initialPieces = (): PieceState => Object.fromEntries(
  COLORS.map((color) => [color, { size: "3×2" as LegoSize, rotated: false }]),
) as PieceState;
const initialConnections = (): LegoConnection[] => COLORS.slice(1).map((top, index) => ({
  bottom: COLORS[index], top, offsetX: 0, offsetY: 0,
}));
const label = (value: string) => value[0] + value.slice(1).toLowerCase();

export default function LegosSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [pieces, setPieces] = useState(initialPieces);
  const [connections, setConnections] = useState(initialConnections);
  const [result, setResult] = useState<LegosOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ pieces, connections, result }), [pieces, connections, result]);

  useSolverModulePersistence<typeof moduleState, LegosOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.pieces !== undefined) setPieces(state.pieces);
      if (state.connections !== undefined) setConnections(state.connections);
      if (state.result !== undefined) setResult(state.result);
    },
    onRestoreSolution: setResult,
    currentModule,
    setIsSolved,
  });

  const updatePiece = (color: LegoColor, change: Partial<PieceState[LegoColor]>) => {
    setPieces((current) => ({ ...current, [color]: { ...current[color], ...change } }));
  };
  const updateConnection = (index: number, change: Partial<LegoConnection>) => {
    setConnections((current) => current.map((connection, item) => item === index
      ? { ...connection, ...change }
      : connection));
  };

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const input = {
        pieces: COLORS.map((color) => {
          const [width, depth] = pieces[color].size.split("×").map(Number);
          return { color, width, depth, rotated: pieces[color].rotated };
        }),
        connections,
      };
      const response = await solveLegos(round.id, bomb.id, currentModule.id, input);
      setResult(response.output);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id, { pieces, connections, result: response.output },
        response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve LEGOs");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setPieces(initialPieces());
    setConnections(initialConnections());
    setResult(null);
    resetSolverState();
  };

  return <SolverLayout>
    <SolverSection
      title="Pieces"
      description="Record each part size, then set whether its long side runs east–west or north–south on the instruction pages."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COLORS.map((color) => <fieldset key={color} className="rounded-lg border p-3">
          <legend className="px-1 text-sm font-semibold">{label(color)}</legend>
          <label className="grid gap-1 text-sm">
            Size
            <select
              value={pieces[color].size}
              onChange={(event) => updatePiece(color, { size: event.target.value as LegoSize })}
              disabled={isLoading || isSolved}
              className="h-9 rounded-md border border-input bg-background px-2"
            >
              {SIZES.map((size) => <option key={size}>{size}</option>)}
            </select>
          </label>
          <label className="mt-2 grid gap-1 text-sm">
            Instruction-page orientation
            <select
              value={pieces[color].rotated ? "vertical" : "horizontal"}
              onChange={(event) => updatePiece(color, { rotated: event.target.value === "vertical" })}
              disabled={isLoading || isSolved || pieces[color].size === "2×2"}
              className="h-9 rounded-md border border-input bg-background px-2"
            >
              <option value="horizontal">Long side east–west</option>
              <option value="vertical">Long side north–south</option>
            </select>
          </label>
        </fieldset>)}
      </div>
    </SolverSection>

    <SolverSection
      title="Instruction pages"
      description="For every page, identify the flashing top piece and enter its lower-left offset from the bottom piece: +X is right and +Y is up."
    >
      <div className="space-y-3">
        {connections.map((connection, index) => <fieldset key={index} className="rounded-lg border p-3">
          <legend className="px-1 text-sm font-semibold">Page {index + 1}</legend>
          <div className="grid gap-2 sm:grid-cols-5">
            {(["bottom", "top"] as const).map((side) => <label key={side} className="grid gap-1 text-sm">
              {label(side)} piece
              <select
                value={connection[side]}
                onChange={(event) => updateConnection(index, { [side]: event.target.value as LegoColor })}
                disabled={isLoading || isSolved}
                className="h-9 rounded-md border border-input bg-background px-2"
              >
                {COLORS.map((color) => <option key={color} value={color}>{label(color)}</option>)}
              </select>
            </label>)}
            {(["offsetX", "offsetY"] as const).map((axis) => <label key={axis} className="grid gap-1 text-sm">
              {axis === "offsetX" ? "X offset" : "Y offset"}
              <input
                type="number"
                min={-7}
                max={7}
                value={connection[axis]}
                onChange={(event) => updateConnection(index, { [axis]: Number(event.target.value) })}
                disabled={isLoading || isSolved}
                className="h-9 rounded-md border border-input bg-background px-2"
              />
            </label>)}
            <Button
              type="button"
              variant="outline"
              onClick={() => setConnections((current) => current.filter((_, item) => item !== index))}
              disabled={isLoading || isSolved || connections.length <= 5}
              className="self-end"
            >
              Remove
            </Button>
          </div>
        </fieldset>)}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => setConnections((current) => [...current, {
          bottom: "RED", top: "GREEN", offsetX: 0, offsetY: 0,
        }])}
        disabled={isLoading || isSolved}
        className="mt-3"
      >
        Add page
      </Button>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection
      title={`${label(result.face)} view — ${label(result.orientation)} at top`}
      description="Paint the BUILD grid to match, leaving transparent cells white, then submit."
      className="border-emerald-500/40"
    >
      <div className="mx-auto grid max-w-lg grid-cols-8 gap-1" role="grid" aria-label="LEGOs submission grid">
        {Array.from({ length: 64 }, (_, displayIndex) => {
          const index = (7 - Math.floor(displayIndex / 8)) * 8 + displayIndex % 8;
          const color = result.cells[index];
          const coordinate = `${String.fromCharCode(65 + index % 8)}${Math.floor(index / 8) + 1}`;
          return <div
            key={index}
            role="gridcell"
            aria-label={`${coordinate}: ${label(color)}`}
            className="aspect-square rounded border border-border"
            style={{ backgroundColor: CSS_COLORS[color] }}
          />;
        })}
      </div>
    </SolverSection>}
    <SolverInstructions>
      The flashing brick is the top brick. Offsets use stud counts between the two lower-left corners.
    </SolverInstructions>
  </SolverLayout>;
}
