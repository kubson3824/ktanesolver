import { useCallback, useMemo, useState } from "react";

import { cn } from "../../lib/cn";
import {
  BUTTON_SEQUENCE_COLORS,
  BUTTON_SEQUENCE_LABELS,
  BUTTON_SEQUENCE_SHAPES,
  solveButtonSequence,
  type ButtonSequenceButton,
  type ButtonSequenceColor,
  type ButtonSequenceLabel,
  type ButtonSequenceOutput,
  type ButtonSequenceShape,
} from "../../services/buttonSequenceService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  StageIndicator,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";
import { Button } from "../ui/button";

type DraftButton = Partial<ButtonSequenceButton>;
type SavedState = {
  completedPanels?: number;
  colorOccurrences?: Partial<Record<ButtonSequenceColor, number>>;
  panel?: number;
  buttons?: DraftButton[];
  result?: ButtonSequenceOutput | null;
  twitchCommand?: string;
};

const blankButtons = (): DraftButton[] => [{}, {}, {}];
const zeroCounts = (): Record<ButtonSequenceColor, number> => ({ RED: 0, YELLOW: 0, BLUE: 0, WHITE: 0 });
const isComplete = (button: DraftButton): button is ButtonSequenceButton =>
  Boolean(button.color && button.label && button.shape);

const COLOR_STYLE: Record<ButtonSequenceColor, string> = {
  RED: "bg-red-500",
  YELLOW: "bg-yellow-400",
  BLUE: "bg-blue-500",
  WHITE: "border border-border bg-white",
};
const SHAPE_LABEL: Record<ButtonSequenceShape, string> = {
  CIRCLE: "○ Circle",
  SQUARE: "□ Square",
  HEXAGON: "⬡ Hexagon",
};
const ACTION_LABEL = {
  SKIP: "Do nothing",
  PRESS: "Tap",
  HOLD: "Hold",
} as const;

export default function ButtonSequenceSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [panel, setPanel] = useState(1);
  const [buttons, setButtons] = useState<DraftButton[]>(blankButtons);
  const [result, setResult] = useState<ButtonSequenceOutput | null>(null);
  const [colorOccurrences, setColorOccurrences] = useState<Record<ButtonSequenceColor, number>>(zeroCounts);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    currentModule, round, isLoading, isSolved, error,
    setIsLoading, setIsSolved, setError, clearError, reset: resetSolverState, markModuleSolved,
  } = useSolver();

  const moduleState = useMemo<SavedState>(() => ({
    panel, buttons, result, colorOccurrences, twitchCommand,
  }), [panel, buttons, result, colorOccurrences, twitchCommand]);

  const restoreState = useCallback((state: SavedState) => {
    if (typeof state.completedPanels === "number") setPanel(Math.min(state.completedPanels + 1, 4));
    else if (typeof state.panel === "number") setPanel(state.panel);
    if (Array.isArray(state.buttons) && state.buttons.length === 3) setButtons(state.buttons);
    if (state.colorOccurrences) setColorOccurrences({ ...zeroCounts(), ...state.colorOccurrences });
    if (state.result !== undefined) setResult(state.result);
    if (typeof state.twitchCommand === "string") setTwitchCommand(state.twitchCommand);
  }, []);

  const restoreSolution = useCallback((solution: ButtonSequenceOutput) => {
    setResult(solution);
    setColorOccurrences({ ...zeroCounts(), ...solution.colorOccurrences });
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.BUTTON_SEQUENCE, result: solution }));
    if (solution.panel < 4) setPanel(solution.panel + 1);
  }, []);

  useSolverModulePersistence<SavedState, ButtonSequenceOutput>({
    state: moduleState,
    onRestoreState: restoreState,
    onRestoreSolution: restoreSolution,
    extractSolution: (raw) => raw && typeof raw === "object" && Array.isArray((raw as ButtonSequenceOutput).actions)
      ? raw as ButtonSequenceOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const updateButton = (index: number, patch: DraftButton) => {
    setButtons((current) => current.map((button, buttonIndex) => buttonIndex === index ? { ...button, ...patch } : button));
    setResult(null);
    setTwitchCommand("");
    clearError();
  };

  const solve = async () => {
    const enteredButtons = buttons.filter(isComplete);
    if (enteredButtons.length !== 3) return setError("Select the color, label, and shape of all 3 buttons");
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");

    setIsLoading(true);
    clearError();
    try {
      const response = await solveButtonSequence(round.id, bomb.id, currentModule.id, panel, enteredButtons);
      const command = generateTwitchCommand({ moduleType: ModuleType.BUTTON_SEQUENCE, result: response.output });
      setResult(response.output);
      setColorOccurrences(response.output.colorOccurrences);
      setTwitchCommand(command);
      if (response.solved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
      } else {
        setPanel((current) => current + 1);
        setButtons(blankButtons());
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Button Sequence");
    } finally {
      setIsLoading(false);
    }
  };

  const restartEntry = () => {
    setPanel(1);
    setButtons(blankButtons());
    setResult(null);
    setColorOccurrences(zeroCounts());
    setTwitchCommand("");
    clearError();
  };
  const reset = () => {
    restartEntry();
    resetSolverState();
  };
  const hasHold = result?.actions.includes("HOLD") ?? false;

  return <SolverLayout>
    <SolverSection title="Panel progress" description={isSolved ? "All 4 panels complete." : `Enter panel ${panel} of 4.`}>
      <StageIndicator total={4} current={isSolved ? 5 : panel} completedThrough={isSolved ? 4 : panel - 1} />
    </SolverSection>

    {!isSolved && <SolverSection title={`Panel ${panel} buttons`} description="Enter the three buttons from left to right. Labels appear as A, D, H, or P on the module.">
      <div className="grid gap-3 lg:grid-cols-3">
        {buttons.map((button, index) => <fieldset key={index} className="rounded-lg border border-border bg-muted/30 p-3">
          <legend className="px-1 text-sm font-semibold">Button {index + 1}</legend>
          <label className="mt-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Color
            <select
              aria-label={`Button ${index + 1} color`}
              value={button.color ?? ""}
              onChange={(event) => updateButton(index, { color: event.target.value as ButtonSequenceColor })}
              disabled={isLoading}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">Select…</option>
              {BUTTON_SEQUENCE_COLORS.map((color) => <option key={color} value={color}>{color[0] + color.slice(1).toLowerCase()}</option>)}
            </select>
          </label>
          <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Label
            <select
              aria-label={`Button ${index + 1} label`}
              value={button.label ?? ""}
              onChange={(event) => updateButton(index, { label: event.target.value as ButtonSequenceLabel })}
              disabled={isLoading}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">Select…</option>
              {BUTTON_SEQUENCE_LABELS.map((label) => <option key={label} value={label}>{label[0]} — {label[0] + label.slice(1).toLowerCase()}</option>)}
            </select>
          </label>
          <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Shape
            <select
              aria-label={`Button ${index + 1} shape`}
              value={button.shape ?? ""}
              onChange={(event) => updateButton(index, { shape: event.target.value as ButtonSequenceShape })}
              disabled={isLoading}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">Select…</option>
              {BUTTON_SEQUENCE_SHAPES.map((shape) => <option key={shape} value={shape}>{SHAPE_LABEL[shape]}</option>)}
            </select>
          </label>
        </fieldset>)}
      </div>
    </SolverSection>}

    <SolverSection title="Cumulative color occurrences" description="Counts include every button entered on completed panels.">
      <div className="flex flex-wrap gap-2">
        {BUTTON_SEQUENCE_COLORS.map((color) => <span key={color} className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-sm">
          <span aria-hidden className={cn("h-3 w-3 rounded-full", COLOR_STYLE[color])} />
          {color[0] + color.slice(1).toLowerCase()}: <strong className="font-mono">{colorOccurrences[color]}</strong>
        </span>)}
      </div>
    </SolverSection>

    {result && <SolverSection title={`Panel ${result.panel} actions`} description="Handle all three buttons, then use the down arrow to submit this panel.">
      <ol className="grid gap-3 sm:grid-cols-3">
        {result.actions.map((action, index) => <li key={index} className={cn(
          "rounded-lg border-2 p-4 text-center",
          action === "HOLD" ? "border-amber-500 bg-amber-500/10" : action === "PRESS" ? "border-emerald-500 bg-emerald-500/10" : "border-border bg-muted/30",
        )}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Button {index + 1}</p>
          <p className="mt-1 text-lg font-bold">{ACTION_LABEL[action]}</p>
        </li>)}
      </ol>
      {hasHold && <div className="mt-4 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
        <p className="font-semibold">Release a held button when the countdown contains:</p>
        <p className="mt-1">Blue 2 · White 7 · Yellow 3 · Magenta 4 · Cyan or any other color 0</p>
        <p className="mt-2 text-muted-foreground">Twitch must use <code>hold N</code>, observe the runtime LED, then <code>release digit</code>; a safe one-shot command cannot be generated for this panel.</p>
      </div>}
    </SolverSection>}

    {!isSolved && panel > 1 && <Button type="button" variant="outline" onClick={restartEntry} disabled={isLoading}>Correct entries from panel 1</Button>}
    <SolverControls
      onSolve={solve}
      onReset={reset}
      isLoading={isLoading}
      isSolved={isSolved}
      isSolveDisabled={!buttons.every(isComplete)}
      solveText={`Solve panel ${panel}`}
    />
    <ErrorAlert error={error} />
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>
      Occurrence counts continue across all four panels and wrap to the first table row after the fifth occurrence. A strike does not regenerate the buttons; only restart entry if an earlier observation was wrong.
    </SolverInstructions>
  </SolverLayout>;
}
