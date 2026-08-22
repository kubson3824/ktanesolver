import { useCallback, useMemo, useState } from "react";
import { solveLedMath, type LedMathOutput } from "../../services/ledMathService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const COLORS = ["RED", "BLUE", "GREEN", "YELLOW"];
const LABELS = ["LED A", "LED B", "Operator LED"];

export default function LedMathSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [colors, setColors] = useState(["", "", ""]), [result, setResult] = useState<LedMathOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ colors, result, twitchCommand }), [colors, result, twitchCommand]);
  useSolverModulePersistence<typeof state, LedMathOutput>({ state, onRestoreState: useCallback(saved => { if (saved.colors) setColors(saved.colors); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []), onRestoreSolution: useCallback((solution: LedMathOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.LED_MATH, result: solution })); }, []), currentModule, setIsSolved });
  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (colors.some(color => !color)) return setError("Select all three LED colors");
    clearError(); setIsLoading(true);
    try {
      const response = await solveLedMath(round.id, bomb.id, currentModule.id, colors[0], colors[1], colors[2]);
      const command = generateTwitchCommand({ moduleType: ModuleType.LED_MATH, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { colors, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve LED Math"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setColors(["", "", ""]); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="LED colors"><div className="grid gap-3 sm:grid-cols-3">{LABELS.map((label, index) => <label key={label}>{label}<select aria-label={`${label} color`} value={colors[index]} onChange={event => { setColors(current => current.map((color, position) => position === index ? event.target.value : color)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-2"><option value="">Select</option>{COLORS.map(color => <option key={color} value={color}>{color.toLowerCase()}</option>)}</select></label>)}</div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate answer" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Submit this number" className="border-emerald-500/40"><p className="text-5xl font-bold">{result.answer}</p><p className="mt-2 text-sm">{result.valueA} {result.operator} {result.valueB}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>LED A is left, LED B is right, and the middle LED selects the operator. Souvenir may ask for any of the three original colors. The Twitch command is conditional because the published source does not contain its current parser.</SolverInstructions>
  </SolverLayout>;
}
