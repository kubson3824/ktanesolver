import { useCallback, useMemo, useState } from "react";
import { solveSymbolCycle, type SymbolCycleInput, type SymbolCycleMode, type SymbolCycleOutput, type SymbolCycleScreen } from "../../services/symbolCycleService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverResult, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const names = (value: string) => value.split(",").map((name) => name.trim()).filter(Boolean);
const inputClass = "mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export default function SymbolCycleSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [mode, setMode] = useState<SymbolCycleMode>("RETROTRANSPHASIC");
  const [referenceCycle, setReferenceCycle] = useState(10);
  const [leftCycleText, setLeftCycleText] = useState("L1, L2, L3");
  const [rightCycleText, setRightCycleText] = useState("R1, R2");
  const [displayedCycle, setDisplayedCycle] = useState(1_000_000);
  const [leftSelectableText, setLeftSelectableText] = useState("");
  const [rightSelectableText, setRightSelectableText] = useState("");
  const [leftSymbol, setLeftSymbol] = useState("L1");
  const [rightSymbol, setRightSymbol] = useState("R1");
  const [incrementScreen, setIncrementScreen] = useState<SymbolCycleScreen>("LEFT");
  const [result, setResult] = useState<SymbolCycleOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const leftCycle = names(leftCycleText);
  const rightCycle = names(rightCycleText);
  const selectedLeftSymbol = leftCycle.includes(leftSymbol) ? leftSymbol : leftCycle[0] ?? "";
  const selectedRightSymbol = rightCycle.includes(rightSymbol) ? rightSymbol : rightCycle[0] ?? "";
  const state = useMemo(() => ({ mode, referenceCycle, leftCycleText, rightCycleText, displayedCycle, leftSelectableText, rightSelectableText, leftSymbol, rightSymbol, incrementScreen, result, twitchCommand }), [mode, referenceCycle, leftCycleText, rightCycleText, displayedCycle, leftSelectableText, rightSelectableText, leftSymbol, rightSymbol, incrementScreen, result, twitchCommand]);

  useSolverModulePersistence<typeof state, SymbolCycleOutput>({
    state,
    onRestoreState: useCallback((saved: Partial<typeof state> & { input?: Partial<SymbolCycleInput> }) => {
      const input = saved.input;
      if (saved.mode ?? input?.mode) setMode((saved.mode ?? input?.mode)!);
      if (saved.referenceCycle ?? input?.referenceCycle) setReferenceCycle((saved.referenceCycle ?? input?.referenceCycle)!);
      if (saved.leftCycleText ?? input?.leftCycle) setLeftCycleText(saved.leftCycleText ?? input!.leftCycle!.join(", "));
      if (saved.rightCycleText ?? input?.rightCycle) setRightCycleText(saved.rightCycleText ?? input!.rightCycle!.join(", "));
      if (saved.displayedCycle ?? input?.displayedCycle) setDisplayedCycle((saved.displayedCycle ?? input?.displayedCycle)!);
      if (saved.leftSelectableText ?? input?.leftSelectable) setLeftSelectableText(saved.leftSelectableText ?? input!.leftSelectable!.join(", "));
      if (saved.rightSelectableText ?? input?.rightSelectable) setRightSelectableText(saved.rightSelectableText ?? input!.rightSelectable!.join(", "));
      if (saved.leftSymbol ?? input?.leftSymbol) setLeftSymbol((saved.leftSymbol ?? input?.leftSymbol)!);
      if (saved.rightSymbol ?? input?.rightSymbol) setRightSymbol((saved.rightSymbol ?? input?.rightSymbol)!);
      if (saved.incrementScreen ?? input?.incrementScreen) setIncrementScreen((saved.incrementScreen ?? input?.incrementScreen)!);
      if (saved.result !== undefined) setResult(saved.result);
      if (saved.twitchCommand !== undefined) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: SymbolCycleOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SYMBOL_CYCLE, result: solution }));
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const input: SymbolCycleInput = {
      mode, referenceCycle, leftCycle, rightCycle, displayedCycle,
      ...(mode === "RETROTRANSPHASIC"
        ? { leftSelectable: names(leftSelectableText), rightSelectable: names(rightSelectableText) }
        : { leftSymbol: selectedLeftSymbol, rightSymbol: selectedRightSymbol, incrementScreen }),
    };
    clearError(); setIsLoading(true);
    try {
      const response = await solveSymbolCycle(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.SYMBOL_CYCLE, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...state, input, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Symbol Cycle"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, mode, referenceCycle, leftCycle, rightCycle, displayedCycle, leftSelectableText, rightSelectableText, selectedLeftSymbol, selectedRightSymbol, incrementScreen, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, state, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setMode("RETROTRANSPHASIC"); setReferenceCycle(10); setLeftCycleText("L1, L2, L3"); setRightCycleText("R1, R2");
    setDisplayedCycle(1_000_000); setLeftSelectableText(""); setRightSelectableText(""); setLeftSymbol("L1"); setRightSymbol("R1");
    setIncrementScreen("LEFT"); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Observed cycles" description="At one displayed cycle number, name each symbol in the order it appears. Any short, unique nicknames work.">
      <label className="text-sm font-medium">Reference cycle number<input type="number" min={0} value={referenceCycle} onChange={(event) => setReferenceCycle(Number(event.target.value))} disabled={isLoading || isSolved} className={inputClass} /></label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Left cycle, from the reference<input value={leftCycleText} onChange={(event) => { setLeftCycleText(event.target.value); setResult(null); }} disabled={isLoading || isSolved} placeholder="crescent, star, wave" className={inputClass} /></label>
        <label className="text-sm font-medium">Right cycle, from the reference<input value={rightCycleText} onChange={(event) => { setRightCycleText(event.target.value); setResult(null); }} disabled={isLoading || isSolved} placeholder="eye, hook" className={inputClass} /></label>
      </div>
    </SolverSection>

    <SolverSection title="After flipping the switch" description="Select the state, then enter what the stopped module shows.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">State<select value={mode} onChange={(event) => { setMode(event.target.value as SymbolCycleMode); setResult(null); }} disabled={isLoading || isSolved} className={inputClass}><option value="RETROTRANSPHASIC">Retrotransphasic — change symbols</option><option value="ANTERODIAMETRIC">Anterodiametric — change number</option></select></label>
        <label className="text-sm font-medium">Displayed cycle number<input type="number" min={0} value={displayedCycle} onChange={(event) => { setDisplayedCycle(Number(event.target.value)); setResult(null); }} disabled={isLoading || isSolved} className={inputClass} /></label>
      </div>
      {mode === "RETROTRANSPHASIC" ? <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Left selectable cycle<input value={leftSelectableText} onChange={(event) => setLeftSelectableText(event.target.value)} disabled={isLoading || isSolved} placeholder="current, after 1 click, after 2 clicks…" className={inputClass} /></label>
        <label className="text-sm font-medium">Right selectable cycle<input value={rightSelectableText} onChange={(event) => setRightSelectableText(event.target.value)} disabled={isLoading || isSolved} placeholder="current, after 1 click, after 2 clicks…" className={inputClass} /></label>
      </div> : <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium">Left displayed symbol<select value={selectedLeftSymbol} onChange={(event) => setLeftSymbol(event.target.value)} disabled={isLoading || isSolved} className={inputClass}>{leftCycle.map((symbol) => <option key={symbol}>{symbol}</option>)}</select></label>
        <label className="text-sm font-medium">Right displayed symbol<select value={selectedRightSymbol} onChange={(event) => setRightSymbol(event.target.value)} disabled={isLoading || isSolved} className={inputClass}>{rightCycle.map((symbol) => <option key={symbol}>{symbol}</option>)}</select></label>
        <label className="text-sm font-medium">Screen that increments<select value={incrementScreen} onChange={(event) => setIncrementScreen(event.target.value as SymbolCycleScreen)} disabled={isLoading || isSolved} className={inputClass}><option value="LEFT">Left</option><option value="RIGHT">Right</option></select></label>
      </div>}
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Solve stopped state" />
    <ErrorAlert error={error} />
    {result?.mode === "RETROTRANSPHASIC" && <SolverResult title="Set the screens" description={`Left: ${result.leftSymbol} (${result.leftClicks} clicks) · Right: ${result.rightSymbol} (${result.rightClicks} clicks)`} />}
    {result?.mode === "ANTERODIAMETRIC" && <SolverResult title={`Set cycle number to ${result.targetCycle}`} description={`${result.clickScreen === "LEFT" ? "Left" : "Right"} screen: ${result.clicks} clicks`} />}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Use the same nicknames whenever a symbol repeats. In the retrotransphasic state, list each stopped-state click cycle starting with the symbol currently shown; include its decoys. In the anterodiametric state, click once if needed to learn which screen increments, then enter the number now shown.</SolverInstructions>
  </SolverLayout>;
}
