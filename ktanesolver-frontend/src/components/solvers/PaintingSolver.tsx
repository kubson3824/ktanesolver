import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import {
  solvePainting, type PaintingCellInput, type PaintingInput, type PaintingOutput,
} from "../../services/paintingService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const COLORS = [
  { name: "BLACK", className: "bg-black" },
  { name: "GRAY", className: "bg-gray-500" },
  { name: "RED", className: "bg-red-600" },
  { name: "BROWN", className: "bg-amber-900" },
  { name: "ORANGE", className: "bg-orange-500" },
  { name: "YELLOW", className: "bg-yellow-400" },
  { name: "GREEN", className: "bg-green-600" },
  { name: "BLUE", className: "bg-blue-600" },
  { name: "PURPLE", className: "bg-purple-600" },
  { name: "PINK", className: "bg-pink-400" },
] as const;
const emptyCells = (): PaintingCellInput[] => Array.from({ length: 9 }, () => ({ label: "", color: "" }));

type SavedState = {
  cells?: PaintingCellInput[];
  result?: PaintingOutput | null;
  input?: PaintingInput;
};

export default function PaintingSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [cells, setCells] = useState(emptyCells);
  const [result, setResult] = useState<PaintingOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo<SavedState>(() => ({ cells, result }), [cells, result]);

  useSolverModulePersistence<SavedState, PaintingOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      const restored = saved.cells ?? saved.input?.cells;
      if(restored?.length === 9) setCells(restored);
      if(saved.result) setResult(saved.result);
    }, []),
    onRestoreSolution: useCallback((solution: PaintingOutput) => setResult(solution), []),
    currentModule,
    setIsSolved,
  });

  const updateCell = (index: number, change: Partial<PaintingCellInput>) => {
    setCells((current) => current.map((cell, cellIndex) => cellIndex === index ? { ...cell, ...change } : cell));
    setResult(null);
    clearError();
  };

  const solve = useCallback(async () => {
    if(!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solvePainting(round.id, bomb.id, currentModule.id, { cells });
      setResult(response.output); setIsSolved(response.solved);
      if(response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { cells, result: response.output }, response.output, response.solved);
    } catch(cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Painting"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, cells, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setCells(emptyCells()); setResult(null); resetSolverState();
  }, [resetSolverState]);

  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.PAINTING, result }) : "";

  return <SolverLayout>
    <SolverSection title="Painting regions" description="Choose any consistent order. If Twitch labels are visible, enter them to generate commands.">
      <div className="grid gap-2 sm:grid-cols-3">
        {cells.map((cell, index) => <fieldset key={index} className="rounded-lg border border-border bg-muted/20 p-3">
          <legend className="px-1 text-sm font-semibold">Region {index + 1}</legend>
          <div className="grid gap-2">
            <select value={cell.color} onChange={(event) => updateCell(index, { color: event.target.value })}
              disabled={isLoading || isSolved} aria-label={`Region ${index + 1} color`}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">Select color</option>
              {COLORS.map((color) => <option key={color.name} value={color.name}>{color.name}</option>)}
            </select>
            <input value={cell.label} onChange={(event) => updateCell(index, { label: event.target.value })}
              disabled={isLoading || isSolved} aria-label={`Region ${index + 1} Twitch label`}
              placeholder="Twitch label (optional)" maxLength={8}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm" />
          </div>
        </fieldset>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved}
      isSolveDisabled={!cells.every((cell) => cell.color)} solveText="Calculate repainting" />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`${result.ruleset} repainting`} className="border-emerald-500/40">
      {result.creativityRule && <p className="mb-3 text-sm text-muted-foreground">The special port/CLR rule applies. These choices change every region to a different color.</p>}
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {result.repaints.map((repaint) => {
          const target = COLORS.find((color) => color.name === repaint.to);
          return <li key={repaint.region} className="flex items-center gap-3 rounded-md border bg-emerald-500/10 p-3">
            <span className={cn("h-8 w-8 shrink-0 rounded-full border border-black/40", target?.className)} aria-hidden />
            <span><strong>Region {repaint.region}{repaint.label ? ` (${repaint.label})` : ""}</strong><br />{repaint.from} → {repaint.to}</span>
          </li>;
        })}
      </ol>
      {!result.creativityRule && <p className="mt-3 text-sm text-muted-foreground">Leave every unlisted region unchanged.</p>}
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Record the nine region colors in any order you can track. Paint only the listed regions; repainting a correct region causes a strike.</SolverInstructions>
  </SolverLayout>;
}
