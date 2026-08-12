import { useCallback, useMemo, useState } from "react";
import {
  solveSpinningButtons, type SpinningButtonInput, type SpinningButtonsOutput,
} from "../../services/spinningButtonsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const COLORS = ["RED", "PURPLE", "ORANGE", "GREY", "GREEN", "BLUE"];
const CHARACTERS = ["f", "l", "q", "w", "y", "d"];
const INITIAL_BUTTONS: SpinningButtonInput[] = COLORS.slice(0, 4).map((color, index) => ({
  color, character: CHARACTERS[index],
}));
const COLOR_STYLES: Record<string, string> = {
  RED: "bg-red-500 text-white",
  PURPLE: "bg-purple-500 text-white",
  ORANGE: "bg-orange-500 text-black",
  GREY: "bg-slate-500 text-white",
  GREEN: "bg-green-500 text-white",
  BLUE: "bg-blue-500 text-white",
};

type SavedState = {
  buttons: SpinningButtonInput[];
  result: SpinningButtonsOutput | null;
  twitchCommand: string;
};

export default function SpinningButtonsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [buttons, setButtons] = useState<SpinningButtonInput[]>(INITIAL_BUTTONS);
  const [result, setResult] = useState<SpinningButtonsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo<SavedState>(() => ({ buttons, result, twitchCommand }), [buttons, result, twitchCommand]);

  useSolverModulePersistence<SavedState, SpinningButtonsOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (Array.isArray(saved.buttons) && saved.buttons.length === 4) setButtons(saved.buttons);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: SpinningButtonsOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SPINNING_BUTTONS, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const updateButton = (index: number, field: keyof SpinningButtonInput, value: string) => {
    setButtons((current) => current.map((button, buttonIndex) =>
      buttonIndex === index ? { ...button, [field]: value } : button));
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveSpinningButtons(round.id, bomb.id, currentModule.id, buttons);
      const command = generateTwitchCommand({ moduleType: ModuleType.SPINNING_BUTTONS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id,
        { buttons, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Spinning Buttons");
    } finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, buttons, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setButtons(INITIAL_BUTTONS); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Buttons" description="Enter the four buttons in any consistent position order.">
      <div className="grid gap-3 sm:grid-cols-2">
        {buttons.map((button, index) => <fieldset key={index} className="rounded-md border p-3">
          <legend className="px-1 text-sm font-semibold">Button {index + 1}</legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-sm">Color
              <select value={button.color} onChange={(event) => updateButton(index, "color", event.target.value)} disabled={isLoading || isSolved} className="rounded-md border bg-background px-2 py-2">
                {COLORS.map((color) => <option key={color}>{color}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">Character
              <select value={button.character} onChange={(event) => updateButton(index, "character", event.target.value)} disabled={isLoading || isSolved} className="rounded-md border bg-background px-2 py-2 font-mono">
                {CHARACTERS.map((character) => <option key={character}>{character}</option>)}
              </select>
            </label>
          </div>
        </fieldset>)}
      </div>
    </SolverSection>

    {result && <SolverSection title="Press in this order" className="border-emerald-500/40">
      <ol className="grid gap-2 sm:grid-cols-2">
        {result.pressOrder.map((button, index) => <li key={button.position} className="flex items-center gap-3 rounded-md border p-3">
          <span className="font-bold">{index + 1}.</span>
          <span className={`rounded px-2 py-1 text-sm font-bold ${COLOR_STYLES[button.color]}`}>{button.color}</span>
          <span className="font-mono text-xl">{button.character}</span>
          <span className="ml-auto text-sm text-muted-foreground">value {button.value}</span>
        </li>)}
      </ol>
    </SolverSection>}

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Order buttons" />
    <ErrorAlert error={error} />
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Colors and characters are each unique. Buttons with the same value may be pressed in either order.</SolverInstructions>
  </SolverLayout>;
}
