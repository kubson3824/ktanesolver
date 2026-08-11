import { useCallback, useMemo, useState } from "react";
import { solveTenButtonColorCode, type TenButtonColorCodeOutput } from "../../services/tenButtonColorCodeService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const COLOR_OPTIONS = ["RED", "GREEN", "BLUE"];
const emptyColors = () => Array<string>(10).fill("");

export default function TenButtonColorCodeSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState(1), [colors, setColors] = useState(emptyColors);
  const [result, setResult] = useState<TenButtonColorCodeOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(s => s.updateModuleAfterSolve);
  const state = useMemo(() => ({ stage, colors, result, twitchCommand }), [stage, colors, result, twitchCommand]);
  useSolverModulePersistence<typeof state, TenButtonColorCodeOutput>({
    state,
    onRestoreState: useCallback(s => { if (s.stage) setStage(s.stage); if (s.colors) setColors(s.colors); if (s.result) setResult(s.result); if (s.twitchCommand) setTwitchCommand(s.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: TenButtonColorCodeOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.TEN_BUTTON_COLOR_CODE, result: solution })); }, []),
    currentModule, setIsSolved,
  });
  const setColor = (index: number, color: string) => {
    setColors(current => current.map((value, position) => position === index ? color : value));
    setResult(null); setTwitchCommand(""); setIsSolved(false); clearError();
  };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (colors.some(color => !color)) return setError("Select all ten initial colors");
    clearError(); setIsLoading(true);
    try {
      const response = await solveTenButtonColorCode(round.id, bomb.id, currentModule.id, stage, colors);
      const command = generateTwitchCommand({ moduleType: ModuleType.TEN_BUTTON_COLOR_CODE, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      const nextStage = response.solved ? stage : 2, nextColors = response.solved ? colors : emptyColors();
      setStage(nextStage); setColors(nextColors);
      updateModuleAfterSolve(bomb.id, currentModule.id, { stage: nextStage, colors: nextColors, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Ten-Button Color Code"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setStage(1); setColors(emptyColors()); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title={`Stage ${stage} initial colors`}>
      <div className="grid grid-cols-5 gap-2">
        {colors.map((color, index) => <label key={index} className="text-center text-sm">Button {index + 1}
          <select aria-label={`Button ${index + 1} color`} value={color} onChange={event => setColor(index, event.target.value)} className="mt-1 h-11 w-full rounded border bg-background px-2">
            <option value="">Select</option>{COLOR_OPTIONS.map(option => <option key={option} value={option}>{option.toLowerCase()}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate colors" />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Stage ${result.stage} target colors`} className="border-emerald-500/40">
      <div className="grid grid-cols-5 gap-2">{result.targetColors.map((color, index) => <div key={index} className="rounded border p-2 text-center"><div className="text-xs">{index + 1}</div><div className="font-semibold">{color.toLowerCase()}</div></div>)}</div>
      <p className="mt-3 text-sm">Presses: {result.presses.length ? result.presses.join(" ") : "none"}; then submit.</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Enter the ten colors in reading order. Execute every listed press, including repeats, then submit. A correct stage 1 submission reveals fresh colors for stage 2. After a strike the module restores that stage’s initial colors; press Reset here only if restarting from stage 1. Souvenir records both stages’ initial colors.</SolverInstructions>
  </SolverLayout>;
}
