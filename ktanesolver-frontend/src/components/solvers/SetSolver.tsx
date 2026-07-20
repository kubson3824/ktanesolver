import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import { solveSet, type SetCardInput, type SetInput, type SetOutput } from "../../services/setService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const SYMBOLS = Array.from({ length: 9 }, (_, index) => `${String.fromCharCode(65 + index % 3)}${Math.floor(index / 3) + 1}`);
const SHADINGS = ["filled", "wavy", "empty"];
const emptyCards = (): SetCardInput[] => Array.from({ length: 9 }, () => ({ symbol: "", dots: -1, shading: "" }));

type SavedState = {
  cards?: SetCardInput[];
  result?: SetOutput | null;
  input?: SetInput;
};

export default function SetSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [cards, setCards] = useState(emptyCards);
  const [result, setResult] = useState<SetOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo<SavedState>(() => ({ cards, result }), [cards, result]);

  useSolverModulePersistence<SavedState, SetOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      const restored = saved.cards ?? saved.input?.cards;
      if (restored?.length === 9) setCards(restored);
      if (saved.result) setResult(saved.result);
    }, []),
    onRestoreSolution: useCallback((solution: SetOutput) => setResult(solution), []),
    currentModule,
    setIsSolved,
  });

  const updateCard = (index: number, change: Partial<SetCardInput>) => {
    setCards((current) => current.map((card, cardIndex) => cardIndex === index ? { ...card, ...change } : card));
    setResult(null);
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { cards };
      const response = await solveSet(round.id, bomb.id, currentModule.id, input);
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { cards, result: response.output }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve S.E.T."); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, cards, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setCards(emptyCards()); setResult(null); resetSolverState();
  }, [resetSolverState]);

  const complete = cards.every((card) => card.symbol && card.dots >= 0 && card.shading);
  const solution = new Set(result?.positions ?? []);
  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.SET, result }) : "";

  return <SolverLayout>
    <SolverSection title="Displayed symbols" description="For each module position, enter the symbol's Table 1 coordinate, dot count, and shading.">
      <div className="grid gap-2 sm:grid-cols-3">
        {cards.map((card, index) => {
          const position = SYMBOLS[index];
          return <fieldset key={position} className="rounded-lg border border-border bg-muted/20 p-3">
            <legend className="px-1 text-sm font-semibold">Module {position}</legend>
            <div className="grid gap-2">
              <select value={card.symbol} onChange={(event) => updateCard(index, { symbol: event.target.value })}
                disabled={isLoading || isSolved} aria-label={`Module ${position} symbol`}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                <option value="">Table symbol</option>
                {SYMBOLS.map((symbol) => <option key={symbol} value={symbol}>{symbol}</option>)}
              </select>
              <select value={card.dots} onChange={(event) => updateCard(index, { dots: Number(event.target.value) })}
                disabled={isLoading || isSolved} aria-label={`Module ${position} dot count`}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                <option value={-1}>Dots</option>
                {[0, 1, 2].map((dots) => <option key={dots} value={dots}>{dots} dot{dots === 1 ? "" : "s"}</option>)}
              </select>
              <select value={card.shading} onChange={(event) => updateCard(index, { shading: event.target.value })}
                disabled={isLoading || isSolved} aria-label={`Module ${position} shading`}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm capitalize">
                <option value="">Shading</option>
                {SHADINGS.map((shading) => <option key={shading} value={shading}>{shading}</option>)}
              </select>
            </div>
          </fieldset>;
        })}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!complete} solveText="Find S.E.T." />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press these symbols" className="border-emerald-500/40">
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-2" role="grid" aria-label="S.E.T. solution grid">
        {SYMBOLS.map((position) => <div key={position} role="gridcell" aria-label={`${position}${solution.has(position) ? ", press" : ""}`} className={cn(
          "flex aspect-square items-center justify-center rounded-lg border text-sm font-semibold",
          solution.has(position) ? "border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "border-border bg-muted/20 text-muted-foreground",
        )}>{position}</div>)}
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Match each glyph to its coordinate in Table 1. Module coordinates use columns A–C and rows 1–3.</SolverInstructions>
  </SolverLayout>;
}
