import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import { solveBraille, type BrailleOutput } from "../../services/brailleService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const EMPTY_PATTERNS = [0, 0, 0, 0];
const GRID_ORDER = [0, 3, 1, 4, 2, 5];

export function BraillePattern({ pattern, className }: { pattern: number; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-2", className)} role="img" aria-label={`Raised dots ${Array.from({ length: 6 }, (_, dot) => pattern & 1 << dot ? dot + 1 : null).filter(Boolean).join(", ")}`}>
    {GRID_ORDER.map((dot) => <span key={dot} className={cn(
      "size-4 rounded-full border-2",
      pattern & 1 << dot ? "border-foreground bg-foreground" : "border-muted-foreground/40",
    )} />)}
  </div>;
}

export default function BrailleSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [patterns, setPatterns] = useState(EMPTY_PATTERNS);
  const [result, setResult] = useState<BrailleOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.BRAILLE, result }) : "";
  const moduleState = useMemo(() => ({ patterns, result }), [patterns, result]);

  useSolverModulePersistence<typeof moduleState, BrailleOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.patterns?.length === 4) setPatterns(state.patterns);
      if (state.result !== undefined) setResult(state.result);
    },
    onRestoreSolution: (solution) => { if (solution?.pressPosition) setResult(solution); },
    currentModule,
    setIsSolved,
  });

  const toggleDot = (cell: number, dot: number) => {
    setPatterns((current) => current.map((pattern, index) => index === cell ? pattern ^ 1 << dot : pattern));
    setResult(null); clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveBraille(round.id, bomb.id, currentModule.id, patterns);
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { patterns, result: response.output }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Braille"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, patterns, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setPatterns(EMPTY_PATTERNS); setResult(null); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Displayed Braille" description="Toggle every raised dot. Dots are numbered down the left column (1–3), then down the right (4–6).">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="group" aria-label="Four displayed Braille cells">
        {patterns.map((pattern, cell) => <fieldset key={cell} className="rounded-lg border border-border bg-muted/30 p-3">
          <legend className="px-1 text-sm font-medium">Cell {cell + 1}</legend>
          <div className="mx-auto grid w-fit grid-cols-2 gap-2">
            {GRID_ORDER.map((dot) => <button
              key={dot}
              type="button"
              aria-label={`Cell ${cell + 1}, dot ${dot + 1}`}
              aria-pressed={Boolean(pattern & 1 << dot)}
              disabled={isLoading || isSolved}
              onClick={() => toggleDot(cell, dot)}
              className={cn(
                "size-9 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                pattern & 1 << dot ? "border-foreground bg-foreground" : "border-muted-foreground/40 bg-background",
              )}
            />)}
          </div>
        </fieldset>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={patterns.some((pattern) => pattern === 0)} solveText="Decode word" />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Decoded word: ${result.word}`} className="border-emerald-500/40">
      <p className="mb-3 text-center text-sm text-muted-foreground">Press Braille cell {result.pressPosition}.</p>
      <div className="grid grid-cols-4 gap-2">
        {patterns.map((pattern, cell) => <div key={cell} className={cn(
          "grid place-items-center rounded-lg border-2 p-4",
          result.pressPosition === cell + 1 ? "border-emerald-500 bg-emerald-500/15" : "border-border opacity-50",
        )}><BraillePattern pattern={pattern} /><span className="mt-2 text-sm font-bold">{cell + 1}</span></div>)}
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>In Twitch Plays, use “cycle” to reveal each cell, then copy the raised dots here.</SolverInstructions>
  </SolverLayout>;
}
