import { useCallback, useMemo, useState } from "react";

import { HUNTING_BUTTONS, HUNTING_CLUES, solveHunting, type HuntingOutput, type HuntingSymbol } from "../../services/huntingService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { cn } from "../../lib/cn";
import { Button } from "../ui/button";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverResult, SolverSection,
  StageIndicator, TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

export function HuntingPictogram({ symbol, size = "normal" }: { symbol: HuntingSymbol; size?: "small" | "normal" }) {
  return <img src={`/hunting/${symbol}.png`} alt={`Hunting pictogram ${symbol}`} className={size === "small" ? "h-10 w-10 object-contain dark:invert" : "h-14 w-14 object-contain dark:invert"} />;
}

function SymbolPicker({ title, value, onChange, disabled }: { title: string; value?: HuntingSymbol; onChange: (symbol: HuntingSymbol) => void; disabled: boolean }) {
  return <fieldset><legend className="mb-2 text-sm font-medium">{title}</legend><div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
    {HUNTING_CLUES.map((symbol) => <button key={symbol} type="button" onClick={() => onChange(symbol)} disabled={disabled} aria-label={`Select ${symbol} as ${title.toLowerCase()}`} aria-pressed={value === symbol} className={cn("flex justify-center rounded-md border p-2", value === symbol && "border-primary bg-primary/10")}><HuntingPictogram symbol={symbol} size="small" /></button>)}
  </div></fieldset>;
}

export default function HuntingSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState(1);
  const [left, setLeft] = useState<HuntingSymbol>();
  const [right, setRight] = useState<HuntingSymbol>();
  const [buttons, setButtons] = useState<HuntingSymbol[]>([]);
  const [result, setResult] = useState<HuntingOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { currentModule, round, isLoading, isSolved, error, setIsLoading, setIsSolved, setError, clearError, reset: resetSolverState, markModuleSolved } = useSolver();
  const moduleState = useMemo(() => ({ stage, left, right, buttons, result, twitchCommand }), [stage, left, right, buttons, result, twitchCommand]);

  const restoreState = useCallback((raw: unknown) => {
    const state = raw as Record<string, unknown>;
    if (Array.isArray(state.clueHistory)) setStage(Math.min(state.clueHistory.length + 1, 4));
    if (typeof state.stage === "number") setStage(state.stage);
    if (typeof state.left === "string") setLeft(state.left as HuntingSymbol);
    if (typeof state.right === "string") setRight(state.right as HuntingSymbol);
    if (Array.isArray(state.buttons)) setButtons(state.buttons as HuntingSymbol[]);
    if (state.result && typeof state.result === "object") setResult(state.result as HuntingOutput);
    if (typeof state.twitchCommand === "string") setTwitchCommand(state.twitchCommand);
  }, []);

  useSolverModulePersistence<typeof moduleState, HuntingOutput>({
    state: moduleState, onRestoreState: restoreState, onRestoreSolution: (solution) => solution && setResult(solution),
    extractSolution: (raw) => raw && typeof raw === "object" && Array.isArray((raw as HuntingOutput).decoys) ? raw as HuntingOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved), currentModule, setIsSolved,
  });

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id || !left || !right) return setError("Select both displayed pictograms");
    setIsLoading(true); clearError();
    try {
      const response = await solveHunting(round.id, bomb.id, currentModule.id, stage, left, right, buttons);
      const command = generateTwitchCommand({ moduleType: ModuleType.HUNTING, result: response.output });
      setResult(response.output); setTwitchCommand(command); setLeft(undefined); setRight(undefined); setButtons([]);
      if (response.solved) { setIsSolved(true); markModuleSolved(bomb.id, currentModule.id); }
      else setStage((current) => current + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Hunting"); }
    finally { setIsLoading(false); }
  };

  const resetAttempt = () => { setStage(1); setLeft(undefined); setRight(undefined); setButtons([]); setResult(null); setTwitchCommand(""); clearError(); };
  const reset = () => { resetAttempt(); resetSolverState(); };
  const complementary = !left || HUNTING_CLUES.indexOf(left as never) < 4 ? HUNTING_CLUES.slice(4) : HUNTING_CLUES.slice(0, 4);

  return <SolverLayout>
    <SolverSection title="Stage progress" description={isSolved ? "All 4 stages complete." : `Stage ${stage} of 4`}><StageIndicator total={4} current={isSolved ? 5 : stage} completedThrough={isSolved ? 4 : stage - 1} /></SolverSection>
    {!isSolved && <SolverSection title={`Stage ${stage} display`} description="Select the pictograms in their exact left-to-right order.">
      <SymbolPicker title="Left pictogram" value={left} onChange={(symbol) => { setLeft(symbol); setRight(undefined); setResult(null); clearError(); }} disabled={isLoading} />
      {left && <div className="mt-4"><fieldset><legend className="mb-2 text-sm font-medium">Right pictogram</legend><div className="grid grid-cols-4 gap-2">
        {complementary.map((symbol) => <button key={symbol} type="button" onClick={() => { setRight(symbol); setResult(null); clearError(); }} disabled={isLoading} aria-label={`Select ${symbol} as right pictogram`} aria-pressed={right === symbol} className={cn("flex justify-center rounded-md border p-2", right === symbol && "border-primary bg-primary/10")}><HuntingPictogram symbol={symbol} /></button>)}
      </div></fieldset></div>}
      <details className="mt-4 rounded-md border p-3"><summary className="cursor-pointer text-sm font-medium">Optional: enter all 5 button pictograms for a Twitch command</summary>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">{HUNTING_BUTTONS.map((symbol) => <button key={symbol} type="button" onClick={() => setButtons((current) => current.includes(symbol) ? current.filter((item) => item !== symbol) : current.length < 5 ? [...current, symbol] : current)} disabled={isLoading} aria-label={`Toggle button pictogram ${symbol}`} aria-pressed={buttons.includes(symbol)} className={cn("flex justify-center rounded-md border p-2", buttons.includes(symbol) && "border-primary bg-primary/10")}><HuntingPictogram symbol={symbol} size="small" /></button>)}</div>
        {buttons.length > 0 && <div className="mt-3 flex flex-wrap gap-2" aria-label="Button pictograms in position order">{buttons.map((symbol, index) => <div key={symbol} className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm"><span>{index + 1}.</span><HuntingPictogram symbol={symbol} size="small" /></div>)}</div>}
        <p className="mt-2 text-xs text-muted-foreground">Selected {buttons.length} of 5, in module position order.</p>
      </details>
    </SolverSection>}
    {result && <><SolverResult title={`Stage ${result.stage}: avoid ${result.decoys.length === 1 ? "this decoy" : "these decoys"}`} description={result.safeButton ? `Button ${result.safeButton} is safe.` : "Press any button whose pictogram is not shown below."} /><div className="flex flex-wrap justify-center gap-3" aria-label="Decoy pictograms">{result.decoys.map((symbol) => <HuntingPictogram key={symbol} symbol={symbol} />)}</div></>}
    {!isSolved && stage > 1 && <Button type="button" variant="outline" onClick={resetAttempt} disabled={isLoading}>Module reset after a strike</Button>}
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!left || !right || buttons.length > 0 && buttons.length !== 5} solveText={`Solve stage ${stage}`} />
    <ErrorAlert error={error} />
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>After pressing a safe button, enter the new clue pair. Earlier clues are retained automatically; if a decoy reset the physical module, use the strike-reset button.</SolverInstructions>
  </SolverLayout>;
}
