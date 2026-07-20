import { useCallback, useMemo, useState } from "react";

import { solveGridlock, type GridlockInput, type GridlockOutput } from "../../services/gridlockService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const COLORS = ["BLUE", "GREEN", "YELLOW", "RED"];
const SYMBOLS = ["TRIANGLE", "DIAMOND", "HEXAGON", "STAR"];
const ARROWS = [
  ["ARROW_N", "↑"], ["ARROW_NE", "↗"], ["ARROW_E", "→"], ["ARROW_SE", "↘"],
  ["ARROW_S", "↓"], ["ARROW_SW", "↙"], ["ARROW_W", "←"], ["ARROW_NW", "↖"],
] as const;
const SYMBOL_LABELS: Record<string, string> = { TRIANGLE: "△", DIAMOND: "◇", HEXAGON: "⎔", STAR: "☆" };
const OPTIONS = [
  { value: "BLANK", label: "Blank" },
  ...ARROWS.map(([value, arrow]) => ({ value, label: `${arrow} Arrow` })),
  ...SYMBOLS.flatMap((symbol) => COLORS.map((color) => ({
    value: `${symbol}_${color}`,
    label: `${color[0]}${color.slice(1).toLowerCase()} ${SYMBOL_LABELS[symbol]}`,
  }))),
];
const emptyPage = () => Array<string>(16).fill("BLANK");
const initialPages = () => Array.from({ length: 5 }, emptyPage);
const coordinate = (index: number) => `${String.fromCharCode(65 + index % 4)}${Math.floor(index / 4) + 1}`;

type PersistedState = {
  pages: string[][];
  pageIndex: number;
  result: GridlockOutput | null;
  twitchCommand: string;
};

export default function GridlockSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [pages, setPages] = useState(initialPages);
  const [pageIndex, setPageIndex] = useState(0);
  const [result, setResult] = useState<GridlockOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ pages, pageIndex, result, twitchCommand }), [pages, pageIndex, result, twitchCommand]);

  useSolverModulePersistence<PersistedState, GridlockOutput>({
    state: moduleState,
    onRestoreState: useCallback((state: Partial<PersistedState> & { input?: Partial<GridlockInput> }) => {
      const savedPages = state.input?.pages ?? state.pages;
      if (savedPages && savedPages.length >= 5 && savedPages.length <= 10) setPages(savedPages);
      if (state.pageIndex !== undefined) setPageIndex(state.pageIndex);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: GridlockOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.GRIDLOCK, result: solution }));
    }, []),
    extractSolution: (raw) => raw && typeof raw === "object" && "coordinate" in raw ? raw as GridlockOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | null)?.solved),
    currentModule,
    setIsSolved,
  });

  const setPageCount = (count: number) => {
    setPages((current) => count > current.length
      ? [...current, ...Array.from({ length: count - current.length }, emptyPage)]
      : current.slice(0, count));
    setPageIndex((current) => Math.min(current, count - 1));
    setResult(null); setTwitchCommand(""); clearError();
  };

  const setCell = (index: number, value: string) => {
    setPages((current) => current.map((page, currentPage) => currentPage === pageIndex
      ? page.map((cell, cellIndex) => cellIndex === index ? value : cell)
      : page));
    setResult(null); setTwitchCommand(""); clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (pages[0].filter((cell) => cell.startsWith("STAR_")).length !== 1) return setError("Page 1 must contain exactly one colored star");
    clearError(); setIsLoading(true);
    try {
      const input = { pages };
      const response = await solveGridlock(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.GRIDLOCK, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, pageIndex, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Gridlock"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, pages, pageIndex, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setPages(initialPages()); setPageIndex(0); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    {!isSolved && <SolverSection title="Displayed pages" description="Set the total shown after the slash, then copy each page. Blank cells are prefilled.">
      <label className="block text-sm font-medium">Total pages
        <select value={pages.length} onChange={(event) => setPageCount(Number(event.target.value))} disabled={isLoading} className="ml-3 h-9 rounded-md border border-input bg-background px-3">
          {[5, 6, 7, 8, 9, 10].map((count) => <option key={count}>{count}</option>)}
        </select>
      </label>
      <div className="my-4 flex flex-wrap gap-2" role="tablist" aria-label="Gridlock pages">
        {pages.map((_, index) => <button key={index} type="button" role="tab" aria-selected={index === pageIndex} onClick={() => setPageIndex(index)} disabled={isLoading} className={`h-9 min-w-9 rounded-md border px-3 ${index === pageIndex ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}>{index + 1}</button>)}
      </div>
      <div className="grid grid-cols-4 gap-2" role="grid" aria-label={`Gridlock page ${pageIndex + 1}`}>
        {pages[pageIndex].map((cell, index) => <label key={index} className="grid min-w-0 gap-1 rounded-md border bg-muted/20 p-2 text-center text-xs font-semibold">
          {coordinate(index)}
          <select aria-label={`Page ${pageIndex + 1} ${coordinate(index)}`} value={cell} onChange={(event) => setCell(index, event.target.value)} disabled={isLoading} className="min-w-0 rounded border bg-background px-1 py-2 text-xs font-normal">
            {OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>}

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find gridlock" />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Press ${result.coordinate}`} description={`Visited path: ${result.path.join(" → ")}`} className="border-emerald-500/40">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-md border-4 border-emerald-500 bg-emerald-500/15 text-4xl font-bold text-emerald-700 dark:text-emerald-300">{result.coordinate}</div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Columns are A–D from left to right; rows are 1–4 from top to bottom. Colored symbols advance the module to the next page before movement.</SolverInstructions>
  </SolverLayout>;
}
