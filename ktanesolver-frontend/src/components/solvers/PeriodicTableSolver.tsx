import { useCallback, useMemo, useState } from "react";
import { solvePeriodicTable, type PeriodicTableColor, type PeriodicTableInput, type PeriodicTableOutput } from "../../services/periodicTableService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const COLORS: PeriodicTableColor[] = ["RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "WHITE"];
const initialInput = (): PeriodicTableInput => ({ elementName: "", elementColor: "RED", symbol: "", symbolColor: "RED", displayedNumber: 1, numberColor: "RED", coloredButtonNumber: 1, buttonColor: "RED" });

export default function PeriodicTableSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [input, setInput] = useState(initialInput);
  const [result, setResult] = useState<PeriodicTableOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ input, result, twitchCommand }), [input, result, twitchCommand]);
  useSolverModulePersistence<typeof state, PeriodicTableOutput>({
    state,
    onRestoreState: useCallback(saved => { if (saved.input) setInput(saved.input); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: PeriodicTableOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.PERIODIC_TABLE, result: solution })); }, []),
    currentModule, setIsSolved,
  });
  const changed = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const update = <K extends keyof PeriodicTableInput>(key: K, value: PeriodicTableInput[K]) => { setInput(current => ({ ...current, [key]: value })); changed(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solvePeriodicTable(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.PERIODIC_TABLE, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Periodic Table"); }
    finally { setIsLoading(false); }
  };
  const colorSelect = (label: string, value: PeriodicTableColor, key: keyof PeriodicTableInput) => <select aria-label={`${label} color`} value={value} onChange={event => update(key, event.target.value as PeriodicTableColor)} className="h-11 rounded border bg-background px-2">{COLORS.map(color => <option key={color}>{color}</option>)}</select>;
  const reset = () => { setInput(initialInput()); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Four colored clues" description="White and grey both use multiplier 6.">
      <div className="space-y-3">
        <div className="grid grid-cols-[1fr_8rem] gap-2"><input aria-label="Element name" value={input.elementName} onChange={event => update("elementName", event.target.value)} placeholder="Element name" className="h-11 rounded border bg-background px-3" />{colorSelect("Element name", input.elementColor, "elementColor")}</div>
        <div className="grid grid-cols-[1fr_8rem] gap-2"><input aria-label="Element symbol" value={input.symbol} onChange={event => update("symbol", event.target.value)} placeholder="Symbol" className="h-11 rounded border bg-background px-3" />{colorSelect("Symbol", input.symbolColor, "symbolColor")}</div>
        <div className="grid grid-cols-[1fr_8rem] gap-2"><input aria-label="Displayed atomic number" type="number" min={1} max={118} value={input.displayedNumber} onChange={event => update("displayedNumber", Number(event.target.value))} className="h-11 rounded border bg-background px-3" />{colorSelect("Displayed number", input.numberColor, "numberColor")}</div>
        <div className="grid grid-cols-[1fr_8rem] gap-2"><input aria-label="Colored button atomic number" type="number" min={1} max={118} value={input.coloredButtonNumber} onChange={event => update("coloredButtonNumber", Number(event.target.value))} className="h-11 rounded border bg-background px-3" />{colorSelect("Colored button", input.buttonColor, "buttonColor")}</div>
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press this element" className="border-emerald-500/40">
      <p className="text-3xl font-bold">{result.atomicNumber} — {result.symbol}</p><p className="text-lg">{result.elementName}</p>
      <p className="mt-2 text-sm">Terms: {result.elementTerm} + {result.symbolTerm} + {result.numberTerm} + {result.buttonTerm} = {result.total}; wrapped to {result.atomicNumber}.</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>For the colored table square, enter its atomic number; starred empty squares do not count. An incorrect press strikes without changing any clues, so the same result remains valid.</SolverInstructions>
  </SolverLayout>;
}
