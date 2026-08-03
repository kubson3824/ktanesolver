import { useCallback, useMemo, useState } from "react";
import {
  solveLogicalButtons,
  type LogicalButtonColor,
  type LogicalButtonInput,
  type LogicalButtonLabel,
  type LogicalButtonsOutput,
  type LogicalOperator,
} from "../../services/logicalButtonsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  StageIndicator, TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const COLORS: LogicalButtonColor[] = [
  "RED", "BLUE", "GREEN", "YELLOW", "PURPLE", "WHITE", "ORANGE", "CYAN", "GREY",
];
const LABELS: LogicalButtonLabel[] = [
  "LOGIC", "COLOR", "LABEL", "BUTTON", "WRONG", "BOOM", "NO", "WAIT", "HMMM",
];
const OPERATORS: LogicalOperator[] = ["AND", "OR", "XOR", "NAND", "NOR", "XNOR"];
const POSITIONS = ["Top", "Bottom left", "Bottom right"];

type ButtonState = {
  color: LogicalButtonColor | "";
  label: LogicalButtonLabel | "";
};
type StageObservation = {
  operator: string;
  buttons: { color: string; label: string }[];
};
type SavedState = { stages: StageObservation[] };

const emptyButtons = (): ButtonState[] => Array.from({ length: 3 }, () => ({ color: "", label: "" }));
const display = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

export default function LogicalButtonsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stages, setStages] = useState<StageObservation[]>([]);
  const [operator, setOperator] = useState<LogicalOperator | "">("");
  const [buttons, setButtons] = useState<ButtonState[]>(emptyButtons);
  const [result, setResult] = useState<LogicalButtonsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const savedState = useMemo(() => ({ stages }), [stages]);
  const currentStage = stages.length + 1;

  useSolverModulePersistence<SavedState, LogicalButtonsOutput>({
    state: savedState,
    onRestoreState: useCallback((saved) => {
      if (Array.isArray(saved.stages)) setStages(saved.stages);
    }, []),
    onRestoreSolution: useCallback((solution: LogicalButtonsOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.LOGICAL_BUTTONS, result: solution }));
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const updateButton = (index: number, patch: Partial<ButtonState>) => {
    setButtons((current) => current.map((button, buttonIndex) =>
      buttonIndex === index ? { ...button, ...patch } : button));
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!operator || buttons.some((button) => !button.color || !button.label)) {
      return setError("Select the operator, color, and label for all three buttons");
    }
    clearError();
    setIsLoading(true);
    try {
      const inputButtons: LogicalButtonInput[] = buttons.map((button) => ({
        color: button.color as LogicalButtonColor,
        label: button.label as LogicalButtonLabel,
      }));
      const response = await solveLogicalButtons(
        round.id, bomb.id, currentModule.id, { operator, buttons: inputButtons },
      );
      const observation: StageObservation = {
        operator,
        buttons: inputButtons.map((button) => ({
          color: display(button.color),
          label: display(button.label),
        })),
      };
      const nextStages = response.output.pressOperator ? stages : [...stages, observation];
      const command = generateTwitchCommand({ moduleType: ModuleType.LOGICAL_BUTTONS, result: response.output });
      setStages(nextStages);
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      else {
        setOperator("");
        if (!response.output.pressOperator) setButtons(emptyButtons());
      }
      updateModuleAfterSolve(
        bomb.id, currentModule.id, { stages: nextStages }, response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Logical Buttons");
    } finally {
      setIsLoading(false);
    }
  }, [
    round?.id, bomb?.id, currentModule?.id, operator, buttons, stages, clearError,
    markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve,
  ]);

  const complete = Boolean(operator) && buttons.every((button) => button.color && button.label);

  return <SolverLayout>
    <SolverSection
      title="Stage progress"
      description={isSolved ? "All three stages complete." : `Stage ${currentStage} of 3`}
    >
      <StageIndicator total={3} current={isSolved ? 4 : currentStage} completedThrough={stages.length} />
    </SolverSection>

    {!isSolved && <>
      <SolverSection title="Logic gate" description="Select the operator shown on the screen.">
        <label className="block text-sm font-medium">
          Operator
          <select
            value={operator}
            onChange={(event) => { setOperator(event.target.value as LogicalOperator | ""); clearError(); }}
            disabled={isLoading}
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select operator…</option>
            {OPERATORS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </SolverSection>

      <SolverSection title="Buttons" description="Buttons are numbered top, bottom-left, bottom-right.">
        <div className="grid gap-3 md:grid-cols-3">
          {buttons.map((button, index) => <fieldset key={POSITIONS[index]} className="rounded-md border p-3">
            <legend className="px-1 text-sm font-semibold">{index + 1}. {POSITIONS[index]}</legend>
            <label className="mt-1 block text-xs font-medium text-muted-foreground">
              Color
              <select
                value={button.color}
                onChange={(event) => updateButton(index, { color: event.target.value as LogicalButtonColor | "" })}
                aria-label={`${POSITIONS[index]} button color`}
                disabled={isLoading}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">Select color…</option>
                {COLORS.map((value) => <option key={value} value={value}>{display(value)}</option>)}
              </select>
            </label>
            <label className="mt-3 block text-xs font-medium text-muted-foreground">
              Label
              <select
                value={button.label}
                onChange={(event) => updateButton(index, { label: event.target.value as LogicalButtonLabel | "" })}
                aria-label={`${POSITIONS[index]} button label`}
                disabled={isLoading}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">Select label…</option>
                {LABELS.map((value) => <option key={value} value={value}>{display(value)}</option>)}
              </select>
            </label>
          </fieldset>)}
        </div>
      </SolverSection>
    </>}

    <SolverControls
      onSolve={solve}
      onReset={() => { setOperator(""); setButtons(emptyButtons()); setResult(null); setTwitchCommand(""); clearError(); }}
      isSolveDisabled={!complete}
      isLoading={isLoading}
      isSolved={isSolved}
      solveText={`Solve stage ${currentStage}`}
      showReset={false}
    />
    <ErrorAlert error={error} />

    {result && <SolverSection
      title={result.pressOperator ? `Stage ${result.stage}: press the operator screen` : `Stage ${result.stage}: press in order`}
      className="border-emerald-500/40"
    >
      {!result.pressOperator && <p className="text-center font-mono text-3xl font-bold">
        {result.pressButtons.join(" → ")}
      </p>}
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>
      Press every listed button in order. If the result says to press the operator screen, enter the new operator without changing the buttons.
    </SolverInstructions>
  </SolverLayout>;
}
