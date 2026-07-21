import { useCallback, useMemo, useState } from "react";

import { solveBackgrounds, type BackgroundsInput, type BackgroundsOutput } from "../../services/backgroundsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ColorSwatchPicker, ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

type Color = BackgroundsInput["backingColor"];
const COLORS = [
  { value: "RED", label: "Red", swatch: "bg-red-600" },
  { value: "ORANGE", label: "Orange", swatch: "bg-orange-500" },
  { value: "YELLOW", label: "Yellow", swatch: "bg-yellow-400" },
  { value: "GREEN", label: "Green", swatch: "bg-green-600" },
  { value: "BLUE", label: "Blue", swatch: "bg-blue-600" },
  { value: "PURPLE", label: "Purple", swatch: "bg-purple-600" },
  { value: "WHITE", label: "White", swatch: "border border-border bg-white" },
  { value: "GRAY", label: "Gray", swatch: "bg-gray-500" },
  { value: "BLACK", label: "Black", swatch: "bg-black" },
] as const;

export default function BackgroundsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [backingColor, setBackingColor] = useState<Color | null>(null);
  const [buttonColor, setButtonColor] = useState<Color | null>(null);
  const [result, setResult] = useState<BackgroundsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ backingColor, buttonColor, result, twitchCommand }),
    [backingColor, buttonColor, result, twitchCommand],
  );

  useSolverModulePersistence<typeof moduleState, BackgroundsOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.backingColor !== undefined) setBackingColor(state.backingColor);
      if (state.buttonColor !== undefined) setButtonColor(state.buttonColor);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.BACKGROUNDS, result: solution }));
    },
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!backingColor || !buttonColor) return setError("Select the backing and button colors.");
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const input = { backingColor, buttonColor };
      const response = await solveBackgrounds(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.BACKGROUNDS, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Backgrounds");
    } finally {
      setIsLoading(false);
    }
  }, [backingColor, buttonColor, round?.id, bomb?.id, currentModule?.id, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setBackingColor(null);
    setButtonColor(null);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Observed colors" description="Select the module backing and the Push Me button colors.">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><p className="text-sm font-medium">Backing</p><ColorSwatchPicker value={backingColor} options={COLORS} onChange={setBackingColor} disabled={isLoading || isSolved} clearable={false} ariaLabel="Backing color" className="flex-wrap" /></div>
        <div className="space-y-2"><p className="text-sm font-medium">Push Me button</p><ColorSwatchPicker value={buttonColor} options={COLORS} onChange={setButtonColor} disabled={isLoading || isSolved} clearable={false} ariaLabel="Push Me button color" className="flex-wrap" /></div>
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!backingColor || !buttonColor} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Target counter" description={`Rules ${result.firstRule} and ${result.secondRule} give letter pair ${result.letterPair}.`} className="border-emerald-500/40">
      <div className="text-center"><p className="text-6xl font-black tabular-nums">{result.targetCount}</p><p className="mt-2 text-sm text-muted-foreground">Press Push Me until the counter reads this value, then press Submit.</p></div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Default rule seed only. The solver uses the bomb's stored batteries, indicators, and ports.</SolverInstructions>
  </SolverLayout>;
}
