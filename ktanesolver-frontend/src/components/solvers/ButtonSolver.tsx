import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveButton as solveButtonApi } from "../../services/buttonService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  SegmentedControl,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverResult,
} from "../common";
import { cn } from "../../lib/cn";

type ButtonColor = "RED" | "BLUE" | "WHITE" | "YELLOW" | "OTHER";
type ButtonLabel = "ABORT" | "DETONATE" | "HOLD" | "PRESS";
type StripColor = "BLUE" | "WHITE" | "YELLOW" | "OTHER";

interface ButtonSolverProps {
  bomb: BombEntity | null | undefined;
}

interface ColorSpec<T extends string> {
  value: T;
  label: string;
  /** tailwind classes for the filled button visual */
  fill: string;
  /** text color to use on top */
  text: string;
}

const BUTTON_COLORS: readonly ColorSpec<ButtonColor>[] = [
  { value: "RED",    label: "Red",    fill: "bg-red-500",                         text: "text-white" },
  { value: "BLUE",   label: "Blue",   fill: "bg-blue-500",                        text: "text-white" },
  { value: "WHITE",  label: "White",  fill: "bg-white border border-border",      text: "text-neutral-900" },
  { value: "YELLOW", label: "Yellow", fill: "bg-yellow-400",                      text: "text-neutral-900" },
  { value: "OTHER",  label: "Other",  fill: "bg-gradient-to-br from-fuchsia-500 to-purple-600", text: "text-white" },
] as const;

const STRIP_COLORS: readonly ColorSpec<StripColor>[] = [
  { value: "BLUE",   label: "Blue",   fill: "bg-blue-500",                         text: "text-white" },
  { value: "WHITE",  label: "White",  fill: "bg-white border border-border",       text: "text-neutral-900" },
  { value: "YELLOW", label: "Yellow", fill: "bg-yellow-400",                       text: "text-neutral-900" },
  { value: "OTHER",  label: "Other",  fill: "bg-gradient-to-br from-fuchsia-500 to-purple-600", text: "text-white" },
] as const;

const LABEL_OPTIONS = [
  { value: "ABORT" as const,    label: "Abort" },
  { value: "DETONATE" as const, label: "Detonate" },
  { value: "HOLD" as const,     label: "Hold" },
  { value: "PRESS" as const,    label: "Press" },
];

export default function ButtonSolver({ bomb }: ButtonSolverProps) {
  const [buttonColor, setButtonColor] = useState<ButtonColor | null>(null);
  const [buttonLabel, setButtonLabel] = useState<ButtonLabel | null>(null);
  const [stripColor, setStripColor] = useState<StripColor | null>(null);
  const [result, setResult] = useState<string>("");
  const [releaseDigit, setReleaseDigit] = useState<number | null>(null);
  const [shouldHold, setShouldHold] = useState(false);
  const [showStripColor, setShowStripColor] = useState(false);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const {
    isLoading,
    error,
    isSolved,
    setIsLoading,
    setError,
    setIsSolved,
    clearError,
    reset: resetSolverState,
    currentModule,
    round,
    markModuleSolved,
  } = useSolver();

  const moduleState = useMemo(
    () => ({
      buttonColor,
      buttonLabel,
      stripColor,
      showStripColor,
      result,
      releaseDigit,
      shouldHold,
      twitchCommand,
    }),
    [buttonColor, buttonLabel, stripColor, showStripColor, result, releaseDigit, shouldHold, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      buttonColor?: ButtonColor | null;
      buttonLabel?: ButtonLabel | null;
      stripColor?: StripColor | null;
      showStripColor?: boolean;
      result?: string;
      releaseDigit?: number | null;
      shouldHold?: boolean;
      twitchCommand?: string;
      color?: ButtonColor | null;
      label?: ButtonLabel | null;
      strip?: StripColor | null;
      instruction?: string;
    }) => {
      const restoredButtonColor = state.buttonColor !== undefined ? state.buttonColor : state.color;
      const restoredButtonLabel = state.buttonLabel !== undefined ? state.buttonLabel : state.label;
      const restoredStripColor = state.stripColor !== undefined ? state.stripColor : state.strip;

      if (restoredButtonColor !== undefined) setButtonColor(restoredButtonColor ?? null);
      if (restoredButtonLabel !== undefined) setButtonLabel(restoredButtonLabel ?? null);
      if (restoredStripColor !== undefined) setStripColor(restoredStripColor ?? null);
      if (state.showStripColor !== undefined) setShowStripColor(state.showStripColor);
      if (state.result !== undefined) setResult(state.result);
      if (state.instruction !== undefined && state.result === undefined) setResult(state.instruction);
      if (state.releaseDigit !== undefined) setReleaseDigit(state.releaseDigit);
      if (state.shouldHold !== undefined) setShouldHold(state.shouldHold);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
      if (restoredStripColor != null) setShowStripColor(true);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: { instruction: string; releaseDigit?: number | null; hold: boolean }) => {
      if (!solution?.instruction) return;
      setResult(solution.instruction);
      setReleaseDigit(solution.releaseDigit ?? null);
      setShouldHold(Boolean(solution.hold));
      setShowStripColor(Boolean(solution.hold));
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.BUTTON,
          result: solution,
        }),
      );
    },
    [],
  );

  useSolverModulePersistence<
    {
      buttonColor: ButtonColor | null;
      buttonLabel: ButtonLabel | null;
      stripColor: StripColor | null;
      showStripColor: boolean;
      result: string;
      releaseDigit: number | null;
      shouldHold: boolean;
      twitchCommand: string;
    },
    { instruction: string; releaseDigit?: number | null; hold: boolean }
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; instruction?: unknown; releaseDigit?: unknown; hold?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object")
          return anyRaw.output as { instruction: string; releaseDigit?: number | null; hold: boolean };
        if (typeof anyRaw.instruction === "string" && typeof anyRaw.hold === "boolean") {
          return {
            instruction: anyRaw.instruction,
            releaseDigit: typeof anyRaw.releaseDigit === "number" ? anyRaw.releaseDigit : null,
            hold: anyRaw.hold,
          };
        }
      }
      return null;
    },
    inferSolved: (sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved) || Boolean(sol),
    currentModule,
    setIsSolved,
  });

  const resetResult = () => {
    setResult("");
    setReleaseDigit(null);
    setShouldHold(false);
    setShowStripColor(false);
    setTwitchCommand("");
    resetSolverState();
  };

  const fullReset = () => {
    setButtonColor(null);
    setButtonLabel(null);
    setStripColor(null);
    resetResult();
  };

  const selectColor = (c: ButtonColor) => {
    setButtonColor(c);
    if (!showStripColor) resetResult();
  };

  const selectLabel = (l: ButtonLabel) => {
    setButtonLabel(l);
    if (!showStripColor) resetResult();
  };

  const handleSolveButton = async (includeStrip = false) => {
    if (!buttonColor || !buttonLabel) {
      setError("Please select both the button color and label.");
      return;
    }
    if (!includeStrip && shouldHold) {
      setShowStripColor(true);
      return;
    }
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();
    try {
      const response = await solveButtonApi(round.id, bomb.id, currentModule.id, {
        input: {
          color: buttonColor,
          label: buttonLabel,
          stripColor: includeStrip ? stripColor ?? undefined : undefined,
        },
      });

      setResult(response.output.instruction);
      setReleaseDigit(response.output.releaseDigit);
      setShouldHold(response.output.hold);

      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.BUTTON,
          result: response.output,
        }),
      );

      if (response.output.hold && !includeStrip) {
        setShowStripColor(true);
      } else {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve button");
    } finally {
      setIsLoading(false);
    }
  };

  const colorSpec = BUTTON_COLORS.find((c) => c.value === buttonColor);

  return (
    <SolverLayout>
      <SolverSection
        title="The button"
        description="Pick the button's physical color and the word printed on it."
      >
        <div className="flex flex-col items-center gap-5">
          {/* Button visual */}
          <div
            className={cn(
              "flex h-28 w-28 items-center justify-center rounded-full shadow-lg transition-all",
              colorSpec ? colorSpec.fill : "bg-muted border border-dashed border-border",
              isSolved && "ring-4 ring-emerald-500 ring-offset-2 ring-offset-card",
            )}
            aria-label={`Button preview${buttonColor ? `: ${colorSpec?.label}` : ""}`}
          >
            <span
              className={cn(
                "text-sm font-bold tracking-wider",
                colorSpec ? colorSpec.text : "text-muted-foreground",
              )}
            >
              {buttonLabel ?? "—"}
            </span>
          </div>

          {/* Color swatches */}
          <div className="flex w-full flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Color
            </span>
            <div className="grid grid-cols-5 gap-2">
              {BUTTON_COLORS.map((c) => {
                const selected = buttonColor === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => selectColor(c.value)}
                    disabled={isSolved}
                    aria-pressed={selected}
                    title={c.label}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-md border p-2 transition-all",
                      selected
                        ? "border-ring ring-2 ring-ring ring-offset-2 ring-offset-card"
                        : "border-border hover:border-foreground/40",
                      isSolved && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <span className={cn("h-8 w-8 rounded-full", c.fill)} aria-hidden />
                    <span className="text-[11px] font-medium text-foreground">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Label segmented control */}
          <div className="flex w-full flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Label
            </span>
            <SegmentedControl
              value={buttonLabel ?? ""}
              onChange={(v) => selectLabel(v as ButtonLabel)}
              options={LABEL_OPTIONS}
              size="sm"
              ariaLabel="Button label"
              disabled={isSolved}
              className="w-full justify-center"
            />
          </div>
        </div>
      </SolverSection>

      {(showStripColor || stripColor != null || shouldHold) && (
        <SolverSection
          title="Strip color"
          description="After you hold the button, a colored strip appears on the side of the module."
        >
          <div className="grid grid-cols-4 gap-2">
            {STRIP_COLORS.map((c) => {
              const selected = stripColor === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setStripColor(c.value)}
                  disabled={isSolved}
                  aria-pressed={selected}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-all",
                    selected
                      ? "border-ring ring-2 ring-ring ring-offset-2 ring-offset-card"
                      : "border-border hover:border-foreground/40",
                    isSolved && "cursor-not-allowed opacity-60",
                  )}
                >
                  <span className={cn("h-5 w-8 rounded", c.fill)} aria-hidden />
                  <span className="text-xs font-medium">{c.label}</span>
                </button>
              );
            })}
          </div>
        </SolverSection>
      )}

      <SolverControls
        onSolve={() => handleSolveButton(showStripColor)}
        onReset={fullReset}
        isSolveDisabled={showStripColor ? !stripColor : !buttonColor || !buttonLabel}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText={showStripColor ? "Submit strip color" : "Solve"}
      />

      <ErrorAlert error={error} />

      {result && (isSolved || !showStripColor) && (
        <SolverResult
          variant={shouldHold ? "warning" : "success"}
          title={result}
          description={
            releaseDigit != null
              ? `Release when the timer shows a ${releaseDigit} in any position.`
              : undefined
          }
        />
      )}

      {twitchCommand && (isSolved || !showStripColor) && (
        <TwitchCommandDisplay command={twitchCommand} />
      )}

      <SolverInstructions>
        {shouldHold
          ? "Hold the button, then set the strip color that appears. The solver will tell you when to release."
          : "Pick the button's physical color and printed label, then press Solve."}
      </SolverInstructions>
    </SolverLayout>
  );
}
