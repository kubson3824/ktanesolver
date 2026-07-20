import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import { solveNonogram, type NonogramInput, type NonogramOutput } from "../../services/nonogramService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const COLORS = ["red", "blue", "green", "yellow", "orange", "purple"];
const LABELS = ["Column A", "Column B", "Column C", "Column D", "Column E", "Row 1", "Row 2", "Row 3", "Row 4", "Row 5"];
const emptyPairs = () => Array.from({ length: 10 }, () => ["", ""]);

type SavedState = {
  colorPairs?: string[][];
  result?: NonogramOutput | null;
  input?: NonogramInput;
};

export default function NonogramSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [colorPairs, setColorPairs] = useState(emptyPairs);
  const [result, setResult] = useState<NonogramOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo<SavedState>(() => ({ colorPairs, result }), [colorPairs, result]);

  useSolverModulePersistence<SavedState, NonogramOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      const pairs = saved.colorPairs ?? saved.input?.colorPairs;
      if (pairs?.length === 10) setColorPairs(pairs);
      if (saved.result) setResult(saved.result);
    }, []),
    onRestoreSolution: useCallback((solution: NonogramOutput) => setResult(solution), []),
    currentModule,
    setIsSolved,
  });

  const setColor = (line: number, position: number, color: string) => {
    setColorPairs((pairs) => pairs.map((pair, index) => index === line
      ? pair.map((value, pairIndex) => pairIndex === position ? color : value)
      : pair));
    setResult(null);
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { colorPairs };
      const response = await solveNonogram(round.id, bomb.id, currentModule.id, input);
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { colorPairs, result: response.output }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Nonogram"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, colorPairs, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setColorPairs(emptyPairs()); setResult(null); resetSolverState();
  }, [resetSolverState]);

  const complete = colorPairs.every(([first, second]) => first && second && first !== second);
  const filled = new Set(result?.filledCells ?? []);
  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.NONOGRAM, result }) : "";

  return <SolverLayout>
    <SolverSection title="Color clues" description="Enter the two colors shown for columns A–E, then rows 1–5. Their order does not matter.">
      <div className="grid gap-2 sm:grid-cols-2">
        {colorPairs.map((pair, line) => <fieldset key={LABELS[line]} className="rounded-lg border border-border bg-muted/20 p-3">
          <legend className="px-1 text-sm font-medium">{LABELS[line]}</legend>
          <div className="grid grid-cols-2 gap-2">
            {pair.map((color, position) => <select key={position} value={color} onChange={(event) => setColor(line, position, event.target.value)}
              disabled={isLoading || isSolved} aria-label={`${LABELS[line]} color ${position + 1}`}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm capitalize">
              <option value="">Color {position + 1}</option>
              {COLORS.map((option) => <option key={option} value={option} disabled={pair[1 - position] === option}>{option}</option>)}
            </select>)}
          </div>
        </fieldset>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!complete} solveText="Solve grid" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Fill these squares" className="border-emerald-500/40">
      <div className="mx-auto grid max-w-xs grid-cols-[auto_repeat(5,1fr)] gap-1" role="grid" aria-label="Solved Nonogram grid">
        <span role="presentation" />
        {result.columnClues.map((clue, column) => <span key={column} role="columnheader" aria-label={`Column ${String.fromCharCode(65 + column)} clue`} className="flex min-h-10 items-end justify-center text-xs font-semibold">{clue.join(" ") || "—"}</span>)}
        {Array.from({ length: 5 }, (_, row) => <div key={row} className="contents" role="row">
          <span role="rowheader" aria-label={`Row ${row + 1} clue`} className="flex items-center justify-end pr-2 text-xs font-semibold">{result.rowClues[row].join(" ") || "—"}</span>
          {Array.from({ length: 5 }, (_, column) => {
            const cell = `${String.fromCharCode(65 + column)}${row + 1}`;
            const active = filled.has(cell);
            return <div key={cell} role="gridcell" aria-label={`${cell} ${active ? "filled" : "empty"}`} className={cn(
              "flex aspect-square items-center justify-center rounded border border-border text-xs font-medium",
              active ? "bg-foreground text-background" : "bg-background text-muted-foreground",
            )}>{cell}</div>;
          })}
        </div>)}
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Use the ! button on the module to reveal each second color. Dots are optional; only filled squares affect submission.</SolverInstructions>
  </SolverLayout>;
}
