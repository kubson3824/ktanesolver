import { useCallback, useMemo, useState } from "react";
import { solveSquareButton, type SquareButtonInput, type SquareButtonOutput } from "../../services/squareButtonService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ColorSwatchPicker, ErrorAlert, SegmentedControl, SolverControls, SolverInstructions,
  SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

type ButtonColor = SquareButtonInput["color"];
type Label = SquareButtonInput["label"];
type LedColor = NonNullable<SquareButtonInput["ledColor"]>;
const BUTTON_COLORS = [
  { value: "BLUE", label: "Blue", swatch: "bg-blue-500" },
  { value: "YELLOW", label: "Yellow", swatch: "bg-yellow-400" },
  { value: "DARK_GREY", label: "Dark grey", swatch: "bg-neutral-700" },
  { value: "WHITE", label: "White", swatch: "bg-white border border-border" },
] as const;
const LABELS = ["PURPLE", "JADE", "MAROON", "INDIGO", "ELEVATE", "RUN", "DETONATE", ""] as const;
const LED_COLORS = [
  { value: "CYAN", label: "Cyan", swatch: "bg-cyan-400" },
  { value: "ORANGE", label: "Orange", swatch: "bg-orange-500" },
  { value: "GREEN", label: "Green", swatch: "bg-green-500" },
] as const;

export default function SquareButtonSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [color, setColor] = useState<ButtonColor | null>(null);
  const [label, setLabel] = useState<Label | null>(null);
  const [ledColor, setLedColor] = useState<LedColor | null>(null);
  const [flickering, setFlickering] = useState<boolean | null>(null);
  const [result, setResult] = useState<SquareButtonOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ color, label, ledColor, flickering, result, twitchCommand }), [color, label, ledColor, flickering, result, twitchCommand]);

  useSolverModulePersistence<typeof moduleState, SquareButtonOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.color !== undefined) setColor(state.color);
      if (state.label !== undefined) setLabel(state.label);
      if (state.ledColor !== undefined) setLedColor(state.ledColor);
      if (state.flickering !== undefined) setFlickering(state.flickering);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SQUARE_BUTTON, result: solution }));
    },
    currentModule, setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!color || label === null) return setError("Select the button color and label.");
    if (result?.hold && (!ledColor || flickering === null)) return setError("Select the LED color and whether it flickers.");
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveSquareButton(round.id, bomb.id, currentModule.id, {
        color, label, ledColor: result?.hold ? ledColor ?? undefined : undefined,
        flickering: result?.hold ? flickering ?? undefined : undefined,
      });
      const command = generateTwitchCommand({ moduleType: ModuleType.SQUARE_BUTTON, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...moduleState, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Square Button"); }
    finally { setIsLoading(false); }
  }, [color, label, result?.hold, ledColor, flickering, round?.id, bomb?.id, currentModule?.id, clearError, setError, setIsLoading, setIsSolved, markModuleSolved, updateModuleAfterSolve, moduleState]);

  const reset = useCallback(() => {
    setColor(null); setLabel(null); setLedColor(null); setFlickering(null); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Square button" description="Select its color and printed label.">
      <div className="space-y-4">
        <ColorSwatchPicker value={color} options={BUTTON_COLORS} onChange={setColor} disabled={isSolved} clearable={false} ariaLabel="Button color" />
        <SegmentedControl value={label ?? "UNSELECTED"} onChange={(value) => setLabel(value as Label)}
          options={LABELS.map((value) => ({ value, label: value || "Blank" }))} disabled={isSolved} size="sm" ariaLabel="Button label" className="flex-wrap" />
      </div>
    </SolverSection>
    {result?.hold && <SolverSection title="Held-button LED" description="Observe the LED after holding the button.">
      <div className="space-y-4">
        <ColorSwatchPicker value={ledColor} options={LED_COLORS} onChange={setLedColor} disabled={isSolved} clearable={false} ariaLabel="LED color" />
        <SegmentedControl value={flickering === null ? "" : flickering ? "FLICKERING" : "SOLID"}
          onChange={(value) => setFlickering(value === "FLICKERING")}
          options={[{ value: "SOLID", label: "Solid" }, { value: "FLICKERING", label: "Flickering" }]} disabled={isSolved} ariaLabel="LED behavior" />
      </div>
    </SolverSection>}
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText={result?.hold ? "Get release rule" : "Solve"} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Instruction" className="border-emerald-500/40"><p className="text-center text-lg font-bold">{result.instruction}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Apply the first matching rule. For a held button, enter the LED color and whether it flickers.</SolverInstructions>
  </SolverLayout>;
}
