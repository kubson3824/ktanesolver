import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import {
  solveComplicatedButtons,
  type ComplicatedButtonInput,
  type ComplicatedButtonsLabel,
  type ComplicatedButtonsOutput,
} from "../../services/complicatedButtonsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ColorSwatchPicker,
  ErrorAlert,
  SegmentedControl,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";

type ButtonColor = "WHITE" | "RED" | "BLUE" | "PURPLE";
type ButtonState = { label: ComplicatedButtonsLabel; color: ButtonColor };
type PersistedState = {
  buttons?: ButtonState[];
  input?: { buttons?: ComplicatedButtonInput[] };
  result?: ComplicatedButtonsOutput | null;
  twitchCommand?: string;
};

const POSITIONS = ["Top", "Middle", "Bottom"];
const LABELS = ["PRESS", "HOLD", "DETONATE"] as const;
const COLORS = [
  { value: "WHITE", label: "White", swatch: "border border-border bg-white" },
  { value: "RED", label: "Red", swatch: "bg-red-600" },
  { value: "BLUE", label: "Blue", swatch: "bg-blue-600" },
  { value: "PURPLE", label: "Purple", swatch: "bg-purple-600" },
] as const;
const BUTTON_CLASSES: Record<ButtonColor, string> = {
  WHITE: "border-border bg-white text-neutral-900",
  RED: "border-red-800 bg-red-600 text-white",
  BLUE: "border-blue-800 bg-blue-600 text-white",
  PURPLE: "border-purple-800 bg-purple-600 text-white",
};
const defaultButtons = (): ButtonState[] => Array.from(
  { length: 3 },
  () => ({ label: "PRESS", color: "WHITE" }),
);

function fromInput(button: ComplicatedButtonInput): ButtonState {
  return {
    label: button.label,
    color: button.red ? (button.blue ? "PURPLE" : "RED") : button.blue ? "BLUE" : "WHITE",
  };
}

function toInput(button: ButtonState): ComplicatedButtonInput {
  return {
    label: button.label,
    red: button.color === "RED" || button.color === "PURPLE",
    blue: button.color === "BLUE" || button.color === "PURPLE",
  };
}

export default function ComplicatedButtonsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [buttons, setButtons] = useState<ButtonState[]>(defaultButtons);
  const [result, setResult] = useState<ComplicatedButtonsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ buttons, result, twitchCommand }), [buttons, result, twitchCommand]);

  useSolverModulePersistence<PersistedState, ComplicatedButtonsOutput>({
    state: moduleState,
    onRestoreState: useCallback((saved) => {
      const restored = saved.buttons ?? saved.input?.buttons?.map(fromInput);
      if (restored?.length === 3) setButtons(restored);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: ComplicatedButtonsOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.COMPLICATED_BUTTONS, result: solution }));
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const updateButton = (index: number, update: Partial<ButtonState>) => {
    setButtons((current) => current.map((button, item) => item === index ? { ...button, ...update } : button));
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveComplicatedButtons(round.id, bomb.id, currentModule.id, buttons.map(toInput));
      const command = generateTwitchCommand({ moduleType: ModuleType.COMPLICATED_BUTTONS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { buttons, result: response.output, twitchCommand: command },
        response.output,
        response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Complicated Buttons");
    } finally {
      setIsLoading(false);
    }
  }, [bomb?.id, buttons, clearError, currentModule?.id, markModuleSolved, round?.id, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setButtons(defaultButtons()); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Buttons" description="Set the three buttons from top to bottom.">
      <div className="space-y-3">
        {buttons.map((button, index) => <div key={index} className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-[7rem_1fr] sm:items-center">
          <div className="text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{POSITIONS[index]}</p>
            <div aria-hidden className={cn("mx-auto flex h-14 w-24 items-center justify-center rounded-full border-2 text-xs font-bold shadow-sm", BUTTON_CLASSES[button.color])}>
              {button.label[0] + button.label.slice(1).toLowerCase()}
            </div>
          </div>
          <div className="space-y-3">
            <ColorSwatchPicker
              value={button.color}
              options={COLORS}
              onChange={(color) => color && updateButton(index, { color })}
              disabled={isSolved || isLoading}
              clearable={false}
              ariaLabel={`${POSITIONS[index]} button color`}
            />
            <SegmentedControl
              value={button.label}
              onChange={(label) => updateButton(index, { label })}
              options={LABELS.map((label) => ({ value: label, label: label[0] + label.slice(1).toLowerCase() }))}
              disabled={isSolved || isLoading}
              size="sm"
              ariaLabel={`${POSITIONS[index]} button label`}
            />
          </div>
        </div>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press in this order" className="border-emerald-500/40">
      <ol className="flex flex-wrap items-center justify-center gap-2" aria-live="polite">
        {result.pressOrder.map((position, index) => <li key={index} className="flex items-center gap-2">
          {index > 0 && <span aria-hidden className="text-muted-foreground">→</span>}
          <span className="rounded-md bg-emerald-500/15 px-3 py-2 font-semibold text-emerald-700 dark:text-emerald-400">
            {position}. {POSITIONS[position - 1]}
          </span>
        </li>)}
      </ol>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Press only the shown sequence. After a strike, restart it from the first shown button.</SolverInstructions>
  </SolverLayout>;
}
