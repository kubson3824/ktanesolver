import { useCallback, useMemo, useState } from "react";
import { MANOMETER_BUTTON_COLORS, MANOMETER_COLORS, MANOMETER_SCREEN_COLORS, solveManometers, type ManometerColor, type ManometersInput, type ManometersOutput } from "../../services/manometersService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function ManometersSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState(1);
  const [screenColor, setScreenColor] = useState("BLUE"); const [minusColor, setMinusColor] = useState("BLUE"); const [plusColor, setPlusColor] = useState("BLUE");
  const [blueScreenSeenPreviously, setBlueScreenSeenPreviously] = useState(false); const [orangeScreenSeenPreviously, setOrangeScreenSeenPreviously] = useState(false);
  const [topColor, setTopColor] = useState<ManometerColor>("BLUE"); const [bottomLeftColor, setBottomLeftColor] = useState<ManometerColor>("BLUE"); const [bottomRightColor, setBottomRightColor] = useState<ManometerColor>("BLUE");
  const [underFiveMinutes, setUnderFiveMinutes] = useState(false);
  const [result, setResult] = useState<ManometersOutput | null>(null); const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ stage, screenColor, minusColor, plusColor, blueScreenSeenPreviously, orangeScreenSeenPreviously, topColor, bottomLeftColor, bottomRightColor, underFiveMinutes, result, twitchCommand }), [stage, screenColor, minusColor, plusColor, blueScreenSeenPreviously, orangeScreenSeenPreviously, topColor, bottomLeftColor, bottomRightColor, underFiveMinutes, result, twitchCommand]);
  useSolverModulePersistence<typeof state, ManometersOutput>({ state,
    onRestoreState: useCallback((saved) => { if (saved.stage === 1 || saved.stage === 2) setStage(saved.stage); if (saved.screenColor) setScreenColor(saved.screenColor); if (saved.minusColor) setMinusColor(saved.minusColor); if (saved.plusColor) setPlusColor(saved.plusColor); if (saved.blueScreenSeenPreviously !== undefined) setBlueScreenSeenPreviously(saved.blueScreenSeenPreviously); if (saved.orangeScreenSeenPreviously !== undefined) setOrangeScreenSeenPreviously(saved.orangeScreenSeenPreviously); if (saved.topColor) setTopColor(saved.topColor); if (saved.bottomLeftColor) setBottomLeftColor(saved.bottomLeftColor); if (saved.bottomRightColor) setBottomRightColor(saved.bottomRightColor); if (saved.underFiveMinutes !== undefined) setUnderFiveMinutes(saved.underFiveMinutes); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: ManometersOutput) => { setResult(solution); setStage(solution.stage); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.MANOMETERS, result: solution })); }, []), currentModule, setIsSolved,
  });
  const changed = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const now = new Date();
    const input: ManometersInput = stage === 1 ? { stage, screenColor, minusColor, plusColor, blueScreenSeenPreviously, orangeScreenSeenPreviously } : {
      stage, topColor, bottomLeftColor, bottomRightColor, underFiveMinutes,
      month: now.getMonth() + 1, day: now.getDate(), dayOfWeek: now.getDay() === 0 ? 7 : now.getDay(), hour: now.getHours(),
    };
    clearError(); setIsLoading(true);
    try {
      const response = await solveManometers(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.MANOMETERS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.output.stage === 1) setStage(2);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...state, ...input, stage: response.output.stage === 1 ? 2 : 2, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Manometers"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setStage(1); setScreenColor("BLUE"); setMinusColor("BLUE"); setPlusColor("BLUE"); setBlueScreenSeenPreviously(screenColor === "BLUE" || blueScreenSeenPreviously); setOrangeScreenSeenPreviously(screenColor === "ORANGE" || orangeScreenSeenPreviously); setTopColor("BLUE"); setBottomLeftColor("BLUE"); setBottomRightColor("BLUE"); setUnderFiveMinutes(false); setResult(null); setTwitchCommand(""); resetSolverState(); };
  const select = (label: string, value: string, setValue: (value: string) => void, colors: readonly string[]) => <label className="text-sm font-medium">{label}<select aria-label={label} value={value} onChange={(event) => { setValue(event.target.value); changed(); }} disabled={isLoading || isSolved} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3">{colors.map((color) => <option key={color}>{color}</option>)}</select></label>;
  return <SolverLayout>
    {stage === 1 ? <SolverSection title="Target-pressure colors"><div className="grid gap-3 sm:grid-cols-3">{select("Screen color", screenColor, setScreenColor, MANOMETER_SCREEN_COLORS)}{select("Minus button color", minusColor, setMinusColor, MANOMETER_BUTTON_COLORS)}{select("Plus button color", plusColor, setPlusColor, MANOMETER_BUTTON_COLORS)}</div><div className="mt-3 grid gap-2 sm:grid-cols-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={blueScreenSeenPreviously} onChange={(event) => setBlueScreenSeenPreviously(event.target.checked)} />A blue screen appeared before this retry</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={orangeScreenSeenPreviously} onChange={(event) => setOrangeScreenSeenPreviously(event.target.checked)} />An orange screen appeared before this retry</label></div></SolverSection>
      : <><SolverSection title="Activated manometers"><div className="grid gap-3 sm:grid-cols-3">{select("Top manometer color", topColor, (value) => setTopColor(value as ManometerColor), MANOMETER_COLORS)}{select("Bottom-left manometer color", bottomLeftColor, (value) => setBottomLeftColor(value as ManometerColor), MANOMETER_COLORS)}{select("Bottom-right manometer color", bottomRightColor, (value) => setBottomRightColor(value as ManometerColor), MANOMETER_COLORS)}</div></SolverSection><label className="flex items-center gap-2 rounded-md border border-input p-3 text-sm"><input type="checkbox" checked={underFiveMinutes} onChange={(event) => { setUnderFiveMinutes(event.target.checked); changed(); }} disabled={isLoading || isSolved} />Bomb timer is under 5:00</label></>}
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText={stage === 1 ? "Calculate target" : "Set manometers"} />
    <ErrorAlert error={error} />
    {result && <SolverSection title={result.stage === 1 ? "Target pressure" : "Pressure settings"} className="border-emerald-500/40">{result.stage === 1 ? <p className="text-center text-3xl font-bold">{result.targetPressure}</p> : <><div className="grid grid-cols-3 gap-2 text-center"><div><p className="text-sm text-muted-foreground">Top</p><p className="text-2xl font-bold">{result.topPressure}</p><p className="text-xs">max {result.topMaximum}</p></div><div><p className="text-sm text-muted-foreground">Bottom left</p><p className="text-2xl font-bold">{result.bottomLeftPressure}</p><p className="text-xs">max {result.bottomLeftMaximum}</p></div><div><p className="text-sm text-muted-foreground">Bottom right</p><p className="text-2xl font-bold">{result.bottomRightPressure}</p><p className="text-xs">max {result.bottomRightMaximum}</p></div></div>{result.useValve && <p className="mt-3 text-center font-semibold">Then turn the valve.</p>}</>}</SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Submit the stage-one target to activate the three manometers. Stage two uses their text colors, bomb edgework, the current local date/time, and the under-5:00 checkbox. A strike or timeout regenerates the whole module; use Reset and replace every observation.</SolverInstructions>
  </SolverLayout>;
}
