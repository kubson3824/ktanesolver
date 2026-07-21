import { useCallback, useMemo, useState } from "react";

import {
  solveFaultyBackgrounds,
  type FaultyBackgroundsColor,
  type FaultyBackgroundsCounterBehavior,
  type FaultyBackgroundsInput,
  type FaultyBackgroundsLabel,
  type FaultyBackgroundsOutput,
} from "../../services/faultyBackgroundsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ColorSwatchPicker, ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

type Button = { color: FaultyBackgroundsColor | null; label: FaultyBackgroundsLabel };

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
const LABELS: ReadonlyArray<{ value: FaultyBackgroundsLabel; label: string }> = [
  { value: "PUSH_ME", label: "PUSH ME!" },
  { value: "BUSH_ME", label: "BUSH ME!" },
  { value: "PUSH_NE", label: "PUSH NE!" },
  { value: "PUSH_HE", label: "PUSH HE!" },
  { value: "PUSH_SHE", label: "PUSH SHE!" },
];
const COUNTER_BEHAVIORS: ReadonlyArray<{ value: FaultyBackgroundsCounterBehavior; label: string }> = [
  { value: "ALL_VISIBLE", label: "Both buttons count; all digits visible" },
  { value: "LEFT_NO_CHANGE", label: "Left button does not change the counter" },
  { value: "RIGHT_NO_CHANGE", label: "Right button does not change the counter" },
  { value: "EVENS_HIDDEN", label: "Even digits disappear" },
  { value: "ODDS_HIDDEN", label: "Odd digits disappear" },
  { value: "FIVE_HIDDEN", label: "Only 5 disappears" },
];
const emptyButtons = (): Button[] => [
  { color: null, label: "PUSH_ME" },
  { color: null, label: "PUSH_ME" },
];

export default function FaultyBackgroundsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [backingColor, setBackingColor] = useState<FaultyBackgroundsColor | null>(null);
  const [buttons, setButtons] = useState<Button[]>(emptyButtons);
  const [counterBehavior, setCounterBehavior] = useState<FaultyBackgroundsCounterBehavior | null>(null);
  const [result, setResult] = useState<FaultyBackgroundsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ backingColor, buttons, counterBehavior, result, twitchCommand }),
    [backingColor, buttons, counterBehavior, result, twitchCommand],
  );

  useSolverModulePersistence<typeof moduleState, FaultyBackgroundsOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.backingColor !== undefined) setBackingColor(state.backingColor);
      if (state.buttons?.length === 2) setButtons(state.buttons);
      if (state.counterBehavior !== undefined) setCounterBehavior(state.counterBehavior);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.FAULTY_BACKGROUNDS, result: solution }));
    },
    currentModule,
    setIsSolved,
  });

  const updateButton = (index: number, update: Partial<Button>) => {
    setButtons((current) => current.map((button, position) => position === index ? { ...button, ...update } : button));
    clearError();
  };

  const solve = useCallback(async () => {
    if (!backingColor || !buttons[0].color || !buttons[1].color || !counterBehavior)
      return setError("Select the backing, both buttons, and counter behavior.");
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input: FaultyBackgroundsInput = {
        backingColor,
        leftButtonColor: buttons[0].color,
        rightButtonColor: buttons[1].color,
        leftButtonLabel: buttons[0].label,
        rightButtonLabel: buttons[1].label,
        counterBehavior,
      };
      const response = await solveFaultyBackgrounds(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.FAULTY_BACKGROUNDS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id, { backingColor, buttons, counterBehavior, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Faulty Backgrounds");
    } finally {
      setIsLoading(false);
    }
  }, [backingColor, bomb?.id, buttons, clearError, counterBehavior, currentModule?.id, markModuleSolved, round?.id, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setBackingColor(null); setButtons(emptyButtons()); setCounterBehavior(null); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Observed colors" description="Select the module backing and each button color.">
      <div className="space-y-2"><p className="text-sm font-medium">Backing</p><ColorSwatchPicker value={backingColor} options={COLORS} onChange={setBackingColor} disabled={isLoading || isSolved} clearable={false} ariaLabel="Backing color" className="flex-wrap" /></div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {buttons.map((button, index) => <div key={index} className="space-y-3 rounded-lg border border-border p-3">
          <p className="text-sm font-semibold">{index === 0 ? "Left" : "Right"} button</p>
          <ColorSwatchPicker value={button.color} options={COLORS} onChange={(color) => updateButton(index, { color })} disabled={isLoading || isSolved} clearable={false} ariaLabel={`${index === 0 ? "Left" : "Right"} button color`} className="flex-wrap" />
          <label className="block text-sm">Label
            <select value={button.label} onChange={(event) => updateButton(index, { label: event.target.value as FaultyBackgroundsLabel })} disabled={isLoading || isSolved} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2">
              {LABELS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>)}
      </div>
    </SolverSection>
    <SolverSection title="Counter behavior" description="Try both buttons and advance the working counter far enough to identify disappearing digits.">
      <label className="block text-sm">Observed behavior
        <select value={counterBehavior ?? ""} onChange={(event) => setCounterBehavior(event.target.value as FaultyBackgroundsCounterBehavior)} disabled={isLoading || isSolved} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2">
          <option value="" disabled>Select behavior</option>
          {COUNTER_BEHAVIORS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!backingColor || buttons.some((button) => !button.color) || !counterBehavior} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Solution" description={`Faulty rule ${result.faultyRule}; Backgrounds rules ${result.firstBackgroundsRule} and ${result.secondBackgroundsRule} give ${result.letterPair}.`} className="border-emerald-500/40">
      <div className="text-center" aria-live="polite"><p className="text-2xl font-bold">Use the {result.correctButton.toLowerCase()} button</p><p className="mt-2 text-6xl font-black tabular-nums">{result.targetCount}</p><p className="mt-2 text-sm text-muted-foreground">Set the counter to this value, then press Submit.</p></div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Default rule seed only. A working button wraps the counter from 9 to 0; the fake button may leave it unchanged.</SolverInstructions>
  </SolverLayout>;
}
