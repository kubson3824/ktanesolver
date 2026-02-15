import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveButton as solveButtonApi } from "../../services/buttonService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { 
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls,
  SolverResult
} from "../common";

type ButtonColor = "RED" | "BLUE" | "WHITE" | "YELLOW" | "OTHER" | null;
type ButtonLabel = "ABORT" | "DETONATE" | "HOLD" | "PRESS" | null;
type StripColor = "BLUE" | "WHITE" | "YELLOW" | "OTHER" | null;

interface ButtonSolverProps {
  bomb: BombEntity | null | undefined;
}

const BUTTON_COLORS: { color: ButtonColor; display: string; className: string }[] = [
  { color: "RED", display: "Red", className: "bg-red-500" },
  { color: "BLUE", display: "Blue", className: "bg-blue-500" },
  { color: "WHITE", display: "White", className: "bg-white border border-gray-300" },
  { color: "YELLOW", display: "Yellow", className: "bg-yellow-400" },
  { color: "OTHER", display: "Other", className: "bg-purple-500" },
  { color: null, display: "Empty", className: "bg-gray-700" },
];

const BUTTON_LABELS: { label: ButtonLabel; display: string }[] = [
  { label: "ABORT", display: "ABORT" },
  { label: "DETONATE", display: "DETONATE" },
  { label: "HOLD", display: "HOLD" },
  { label: "PRESS", display: "PRESS" },
  { label: null, display: "Empty" },
];

const STRIP_COLORS: { color: StripColor; display: string; className: string }[] = [
  { color: "BLUE", display: "Blue", className: "bg-blue-500" },
  { color: "WHITE", display: "White", className: "bg-white border border-gray-300" },
  { color: "YELLOW", display: "Yellow", className: "bg-yellow-400" },
  { color: "OTHER", display: "Other", className: "bg-purple-500" },
  { color: null, display: "None", className: "bg-gray-700" },
];

export default function ButtonSolver({ bomb }: ButtonSolverProps) {
  const [buttonColor, setButtonColor] = useState<ButtonColor>(null);
  const [buttonLabel, setButtonLabel] = useState<ButtonLabel>(null);
  const [stripColor, setStripColor] = useState<StripColor>(null);
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
      buttonColor?: ButtonColor;
      buttonLabel?: ButtonLabel;
      stripColor?: StripColor;
      showStripColor?: boolean;
      result?: string;
      releaseDigit?: number | null;
      shouldHold?: boolean;
      twitchCommand?: string;
      color?: ButtonColor;
      label?: ButtonLabel;
      strip?: StripColor;
      instruction?: string;
    }) => {
      const restoredButtonColor = state.buttonColor !== undefined ? state.buttonColor : state.color;
      const restoredButtonLabel = state.buttonLabel !== undefined ? state.buttonLabel : state.label;
      const restoredStripColor = state.stripColor !== undefined ? state.stripColor : state.strip;

      if (restoredButtonColor !== undefined) setButtonColor(restoredButtonColor);
      if (restoredButtonLabel !== undefined) setButtonLabel(restoredButtonLabel);
      if (restoredStripColor !== undefined) setStripColor(restoredStripColor);
      if (state.showStripColor !== undefined) setShowStripColor(state.showStripColor);
      if (state.result !== undefined) setResult(state.result);
      if (state.instruction !== undefined && state.result === undefined) setResult(state.instruction);
      if (state.releaseDigit !== undefined) setReleaseDigit(state.releaseDigit);
      if (state.shouldHold !== undefined) setShouldHold(state.shouldHold);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);

      if (restoredStripColor != null) {
        setShowStripColor(true);
      }
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

      const command = generateTwitchCommand({
        moduleType: ModuleType.BUTTON,
        result: solution,
      });
      setTwitchCommand(command);
    },
  []);

  useSolverModulePersistence<
    {
      buttonColor: ButtonColor;
      buttonLabel: ButtonLabel;
      stripColor: StripColor;
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
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as { instruction: string; releaseDigit?: number | null; hold: boolean };
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

  const handleSolveButton = async (includeStrip = false) => {
    if (!buttonColor || !buttonLabel) {
      setError("Please select button color and label");
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
      const stripToSend = includeStrip ? stripColor : undefined;
      const response = await solveButtonApi(round.id, bomb.id, currentModule.id, {
        input: {
          color: buttonColor,
          label: buttonLabel,
          stripColor: stripToSend
        }
      });

      setResult(response.output.instruction);
      setReleaseDigit(response.output.releaseDigit);
      setShouldHold(response.output.hold);

      // Generate Twitch command
      const command = generateTwitchCommand({
        moduleType: ModuleType.BUTTON,
        result: response.output,
      });
      setTwitchCommand(command);

      // Show strip color if we need to hold and haven't provided strip color yet
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

  const cycleButtonColor = () => {
    const currentIndex = BUTTON_COLORS.findIndex((c) => c.color === buttonColor);
    const nextIndex = (currentIndex + 1) % BUTTON_COLORS.length;
    setButtonColor(BUTTON_COLORS[nextIndex].color);
    // Only reset if we haven't already shown strip color
    if (!showStripColor) {
      reset();
    }
  };

  const cycleButtonLabel = () => {
    const currentIndex = BUTTON_LABELS.findIndex((l) => l.label === buttonLabel);
    const nextIndex = (currentIndex + 1) % BUTTON_LABELS.length;
    setButtonLabel(BUTTON_LABELS[nextIndex].label);
    // Only reset if we haven't already shown strip color
    if (!showStripColor) {
      reset();
    }
  };

  const cycleStripColor = () => {
    const currentIndex = STRIP_COLORS.findIndex((c) => c.color === stripColor);
    const nextIndex = (currentIndex + 1) % STRIP_COLORS.length;
    setStripColor(STRIP_COLORS[nextIndex].color);
  };

  const reset = () => {
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
    reset();
  };

  const currentColorClass = BUTTON_COLORS.find((c) => c.color === buttonColor)?.className || "bg-gray-700";

  return (
    <SolverLayout>
      {/* Bomb module visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <div className="space-y-4">
          {/* Button */}
          <div className="flex justify-center">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${currentColorClass} ${
                isSolved ? "ring-4 ring-green-400 ring-opacity-75" : "hover:opacity-90"
              }`}
              onClick={cycleButtonColor}
              title="Click to change color"
            >
              <span className={`text-lg font-bold ${buttonColor === 'WHITE' || buttonColor === 'YELLOW' ? 'text-black' : 'text-white'}`}>
                {buttonLabel || "?"}
              </span>
            </div>
          </div>

          {/* Label selector */}
          <div className="flex justify-center">
            <button
              onClick={cycleButtonLabel}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
              disabled={isSolved}
            >
              Label: {buttonLabel || "Select"}
            </button>
          </div>

          {/* Strip color selector - shown after holding */}
          {(showStripColor || stripColor != null || shouldHold) && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-center text-gray-400 mb-3">Strip color:</p>
              <div className="flex justify-center">
                <button
                  onClick={cycleStripColor}
                  className={`w-full max-w-xs h-12 rounded-lg transition-all duration-200 ${
                    STRIP_COLORS.find((c) => c.color === stripColor)?.className || "bg-gray-700"
                  } ${stripColor ? "shadow-lg" : ""}`}
                >
                  <span className="text-black font-medium">
                    {STRIP_COLORS.find((c) => c.color === stripColor)?.display || "Select"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <SolverControls
        onSolve={() => showStripColor ? handleSolveButton(true) : handleSolveButton(false)}
        onReset={fullReset}
        isSolveDisabled={showStripColor ? !stripColor : (!buttonColor || !buttonLabel)}
        isLoading={isLoading}
        solveText={showStripColor ? "Submit Strip Color" : "Solve Button"}
      />

      {/* Error display */}
      <ErrorAlert error={error} />

      {/* Solution - single block to avoid duplicate boxes for "Press and immediately release" */}
      {result && (isSolved || !showStripColor) && (
        <SolverResult
          variant={shouldHold ? "warning" : "success"}
          title={result}
          description={releaseDigit != null ? `Release when timer has a ${releaseDigit} in any position` : undefined}
        />
      )}

      {/* Twitch Command */}
      {twitchCommand && (isSolved || !showStripColor) && (
        <TwitchCommandDisplay command={twitchCommand} />
      )}

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Click the button to cycle through colors, click the label button to cycle through labels.</p>
          <div className="flex flex-wrap gap-2">
              {BUTTON_COLORS.filter((b) => b.color !== null).map((button) => (
                  <div key={button.color} className="flex items-center gap-1">
                      <div className={`w-4 h-4 rounded ${button.className}`}></div>
                      <span className="text-xs">{button.display}</span>
                  </div>
              ))}
          </div>
          {shouldHold && (
          <p className="text-warning">After holding the button, select the strip color that appears below.</p>
        )}
      </div>
    </SolverLayout>
  );
}
