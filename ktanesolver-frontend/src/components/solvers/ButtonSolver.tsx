import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveButton as solveButtonApi } from "../../services/buttonService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { 
  useSolver,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  BombInfoDisplay,
  SolverControls
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
    moduleNumber
  } = useSolver();

  // Restore state from module when component loads
  useEffect(() => {
    if (currentModule?.state && typeof currentModule.state === 'object') {
      const moduleState = currentModule.state as { 
        buttonColor?: ButtonColor; 
        buttonLabel?: ButtonLabel; 
        stripColor?: StripColor;
        showStripColor?: boolean;
      };
      
      if (moduleState.buttonColor) setButtonColor(moduleState.buttonColor);
      if (moduleState.buttonLabel) setButtonLabel(moduleState.buttonLabel);
      if (moduleState.stripColor) setStripColor(moduleState.stripColor);
      if (moduleState.showStripColor) setShowStripColor(moduleState.showStripColor);
    }

    // Restore solution if module was solved
    if (currentModule?.solution && typeof currentModule.solution === 'object') {
      const solution = currentModule.solution as { 
        instruction?: string; 
        releaseDigit?: number; 
        hold?: boolean;
      };
      
      if (solution.instruction) {
        setResult(solution.instruction);
        setIsSolved(true);
      }
      if (solution.releaseDigit) setReleaseDigit(solution.releaseDigit);
      if (solution.hold !== undefined) setShouldHold(solution.hold);

      // Generate twitch command from the solution
      if (solution.instruction) {
        const command = generateTwitchCommand({
          moduleType: ModuleType.BUTTON,
          result: solution,
          moduleNumber
        });
        setTwitchCommand(command);
      }
    }
  }, [currentModule, moduleNumber, setIsSolved]);

  // Save state when inputs change
  const saveState = () => {
    if (currentModule) {
      const moduleState = {
        buttonColor,
        buttonLabel,
        stripColor,
        showStripColor
      };
      
      useRoundStore.getState().round?.bombs.forEach(b => {
        if (b.id === bomb?.id) {
          const module = b.modules.find(m => m.id === currentModule.id);
          if (module) {
            module.state = moduleState;
          }
        }
      });
    }
  };

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

      // Debug: log the actual response structure
      console.log('Full response:', response);
      console.log('Response output:', response.output);
      console.log('Hold value:', response.output.hold);

      setResult(response.output.instruction);
      setReleaseDigit(response.output.releaseDigit);
      setShouldHold(response.output.hold);

      // Generate Twitch command
      const command = generateTwitchCommand({
        moduleType: ModuleType.BUTTON,
        result: response.output,
        moduleNumber
      });
      setTwitchCommand(command);

      // Show strip color if we need to hold and haven't provided strip color yet
      if (response.output.hold && !includeStrip) {
        setShowStripColor(true);
      } else {
        setIsSolved(true);
        // Mark module as solved if it's an immediate press or we've completed the hold sequence
        if (!response.output.hold || includeStrip) {
          markModuleSolved(bomb.id, currentModule.id);
        }
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
    saveState();
  };

  const cycleButtonLabel = () => {
    const currentIndex = BUTTON_LABELS.findIndex((l) => l.label === buttonLabel);
    const nextIndex = (currentIndex + 1) % BUTTON_LABELS.length;
    setButtonLabel(BUTTON_LABELS[nextIndex].label);
    // Only reset if we haven't already shown strip color
    if (!showStripColor) {
      reset();
    }
    saveState();
  };

  const cycleStripColor = () => {
    const currentIndex = STRIP_COLORS.findIndex((c) => c.color === stripColor);
    const nextIndex = (currentIndex + 1) % STRIP_COLORS.length;
    setStripColor(STRIP_COLORS[nextIndex].color);
    saveState();
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
          {showStripColor && (
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

      {/* Bomb info display */}
      <BombInfoDisplay bomb={bomb} />

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

      {/* Result */}
      {result && (
        <div className="alert alert-success mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-bold">{result}</span>
        </div>
      )}

      {/* Result */}
      {result && (isSolved || !showStripColor) && (
        <div className={`alert mb-4 ${shouldHold ? "alert-warning" : "alert-success"}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            {shouldHold ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            )}
          </svg>
          <div>
            <span className="font-bold">{result}</span>
            {releaseDigit && (
              <p className="text-sm mt-1">Release when timer has a <span className="font-bold text-lg">{releaseDigit}</span> in any position</p>
            )}
          </div>
        </div>
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
