import { useCallback, useMemo, useState } from "react";
import { solveTashaSqueals, TASHA_COLORS, type TashaColor, type TashaSquealsOutput } from "../../services/tashaSquealsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const label = (color: TashaColor) => color[0] + color.slice(1).toLowerCase();
const POSITIONS = ["Top", "Right", "Bottom", "Left"];

export default function TashaSquealsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [layout, setLayout] = useState<TashaColor[]>(["PINK", "GREEN", "YELLOW", "BLUE"]);
  const [flashes, setFlashes] = useState<TashaColor[]>(["PINK", "GREEN", "YELLOW", "BLUE", "PINK"]);
  const [result, setResult] = useState<TashaSquealsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ layout, flashes, result, twitchCommand }), [layout, flashes, result, twitchCommand]);

  useSolverModulePersistence<typeof state, TashaSquealsOutput>({
    state,
    onRestoreState: useCallback(saved => { if (saved.layout) setLayout(saved.layout); if (saved.flashes) setFlashes(saved.flashes); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: TashaSquealsOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.TASHA_SQUEALS, result: solution })); }, []),
    currentModule, setIsSolved,
  });
  const changed = (setter: React.Dispatch<React.SetStateAction<TashaColor[]>>, index: number, value: TashaColor) => {
    setter(current => current.map((color, position) => position === index ? value : color));
    setResult(null); setTwitchCommand(""); setIsSolved(false); clearError();
  };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveTashaSqueals(round.id, bomb.id, currentModule.id, layout[0], layout[1], layout[2], layout[3], flashes);
      const command = generateTwitchCommand({ moduleType: ModuleType.TASHA_SQUEALS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { layout, flashes, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Tasha Squeals"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setLayout(["PINK", "GREEN", "YELLOW", "BLUE"]); setFlashes(["PINK", "GREEN", "YELLOW", "BLUE", "PINK"]); setResult(null); setTwitchCommand(""); resetSolverState(); };
  const select = (value: TashaColor, onChange: (value: TashaColor) => void, aria: string) =>
    <select aria-label={aria} value={value} onChange={event => onChange(event.target.value as TashaColor)} className="mt-1 h-11 w-full rounded border bg-background px-2">{TASHA_COLORS.map(color => <option key={color} value={color}>{label(color)}</option>)}</select>;

  return <SolverLayout>
    <SolverSection title="Button colors"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{layout.map((color, index) => <label key={POSITIONS[index]}>{POSITIONS[index]}{select(color, value => changed(setLayout, index, value), `${POSITIONS[index]} button color`)}</label>)}</div></SolverSection>
    <SolverSection title="Flashed colors"><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{flashes.map((color, index) => <label key={index}>Stage {index + 1}{select(color, value => changed(setFlashes, index, value), `Stage ${index + 1} flashed color`)}</label>)}</div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Decode sequence" /><ErrorAlert error={error} />
    {result && <SolverSection title="Cumulative presses" className="border-emerald-500/40">{result.stageSequences.map((sequence, index) => <p key={index} className="mt-2"><span className="font-semibold">Stage {index + 1}:</span> {sequence.map(label).join(" → ")}</p>)}</SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Enter the physical button colors clockwise from the top, then the five flashed colors. Each stage repeats every earlier answer before the new one. The solver uses the total battery count and retains all flashes for Souvenir.</SolverInstructions>
  </SolverLayout>;
}
