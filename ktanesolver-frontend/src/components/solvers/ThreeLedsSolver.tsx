import { useCallback, useMemo, useState } from "react";
import { solveThreeLeds, type ThreeLedsOutput } from "../../services/threeLedsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const COLORS = ["WHITE", "RED", "BLUE", "GREEN", "YELLOW"];
const POSITIONS = ["Top", "Bottom-left", "Bottom-right"];

export default function ThreeLedsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [colors, setColors] = useState(["", "", ""]), [initialStates, setInitialStates] = useState([false, false, false]);
  const [result, setResult] = useState<ThreeLedsOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ colors, initialStates, result, twitchCommand }), [colors, initialStates, result, twitchCommand]);
  useSolverModulePersistence<typeof state, ThreeLedsOutput>({
    state,
    onRestoreState: useCallback(saved => { if (saved.colors) setColors(saved.colors); if (saved.initialStates) setInitialStates(saved.initialStates); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: ThreeLedsOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.THREE_LEDS, result: solution })); }, []),
    currentModule, setIsSolved,
  });
  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const setColor = (index: number, value: string) => { setColors(current => current.map((color, position) => position === index ? value : color)); changed(); };
  const setInitialState = (index: number, value: boolean) => { setInitialStates(current => current.map((state, position) => position === index ? value : state)); changed(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (colors.some(color => !color)) return setError("Select all three LED colors");
    clearError(); setIsLoading(true);
    try {
      const response = await solveThreeLeds(round.id, bomb.id, currentModule.id, colors, initialStates);
      const command = generateTwitchCommand({ moduleType: ModuleType.THREE_LEDS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { colors, initialStates, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve 3 LEDs"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setColors(["", "", ""]); setInitialStates([false, false, false]); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Initial LEDs"><div className="grid gap-3 sm:grid-cols-3">
      {POSITIONS.map((position, index) => <div key={position} className="rounded border p-3"><p className="font-medium">{position}</p>
        <label className="mt-2 block">Color<select aria-label={`${position} LED color`} value={colors[index]} onChange={event => setColor(index, event.target.value)} className="mt-1 h-11 w-full rounded border bg-background px-2"><option value="">Select</option>{COLORS.map(color => <option key={color} value={color}>{color.toLowerCase()}</option>)}</select></label>
        <label className="mt-2 block">State<select aria-label={`${position} LED initial state`} value={initialStates[index] ? "ON" : "OFF"} onChange={event => setInitialState(index, event.target.value === "ON")} className="mt-1 h-11 w-full rounded border bg-background px-2"><option value="OFF">off</option><option value="ON">on</option></select></label>
      </div>)}
    </div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate LED states" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Set and submit" className="border-emerald-500/40"><div className="grid grid-cols-3 gap-2">{result.targetStates.map((on, index) => <div key={POSITIONS[index]} className="rounded border p-2 text-center"><div className="text-xs">{POSITIONS[index]}</div><div className="font-semibold">{on ? "ON" : "OFF"}</div></div>)}</div><p className="mt-3 text-sm">Toggle: {result.togglePositions.length ? result.togglePositions.join(" ") : "none"}; then submit.</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Enter the LEDs in reading order: top, bottom-left, bottom-right. Toggle only the listed LEDs, then press the black submit button. A strike restores the initial states. Souvenir may ask for that exact initial three-LED layout.</SolverInstructions>
  </SolverLayout>;
}
