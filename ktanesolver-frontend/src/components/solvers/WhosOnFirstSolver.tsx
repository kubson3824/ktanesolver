import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { solveWhosOnFirst, type ButtonPosition, type WhosOnFirstSolveRequest } from "../../services/whosOnFirstService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ModuleType } from "../../types";
import { 
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls,
  SolverResult
} from "../common";

interface WhosOnFirstSolverProps {
  bomb: BombEntity | null | undefined;
}

const BUTTON_POSITIONS: {
  position: ButtonPosition;
  label: string;
  gridClass: string;
}[] = [
  { position: "TOP_LEFT", label: "Top Left", gridClass: "col-start-1 row-start-1" },
  { position: "TOP_RIGHT", label: "Top Right", gridClass: "col-start-2 row-start-1" },
  { position: "MIDDLE_LEFT", label: "Middle Left", gridClass: "col-start-1 row-start-2" },
  { position: "MIDDLE_RIGHT", label: "Middle Right", gridClass: "col-start-2 row-start-2" },
  { position: "BOTTOM_LEFT", label: "Bottom Left", gridClass: "col-start-1 row-start-3" },
  { position: "BOTTOM_RIGHT", label: "Bottom Right", gridClass: "col-start-2 row-start-3" },
];

const COMMON_WORDS = [
  "YES", "FIRST", "DISPLAY", "OKAY", "SAYS", "NOTHING", "BLANK", "NO", "LED", "LEAD", "READ",
  "RED", "GREEN", "BLUE", "STREET", "WHEN", "PRESS", "YOU", "YOUR", "YOU'RE", "YOU ARE",
  "UR", "THERE", "THEY'RE", "THEIR", "THEY ARE", "SEE", "C", "CEE", "DONE", "NEXT", "HOLD",
  "U", "UH HUH", "UH UH", "UHHH", "WHAT?", "RIGHT", "LEFT", "MIDDLE", "READY", "WAIT",
  "PRESS", "YOU ARE", "SURE", "WHAT", "LIKE"
];

const EMPTY_BUTTONS: Record<ButtonPosition, string> = {
  TOP_LEFT: "",
  TOP_RIGHT: "",
  MIDDLE_LEFT: "",
  MIDDLE_RIGHT: "",
  BOTTOM_LEFT: "",
  BOTTOM_RIGHT: "",
};

/** API state shape from backend (displayHistory, buttonHistory, buttonPressHistory) */
interface WhosOnFirstApiState {
  displayHistory: string[];
  buttonHistory: Record<string, string>[];
  buttonPressHistory: Record<string, string>[];
}

function isWhosOnFirstApiState(
  state: unknown
): state is WhosOnFirstApiState {
  if (!state || typeof state !== "object") return false;
  const s = state as Record<string, unknown>;
  return (
    Array.isArray(s.displayHistory) &&
    Array.isArray(s.buttonHistory) &&
    Array.isArray(s.buttonPressHistory)
  );
}

/** Extract single key/value from a buttonPressHistory entry (position -> buttonText) */
function entryToPositionAndText(
  entry: Record<string, string>
): { position: ButtonPosition; buttonText: string } | null {
  const keys = Object.keys(entry);
  if (keys.length !== 1) return null;
  const pos = keys[0] as ButtonPosition;
  const text = entry[pos];
  if (typeof text !== "string") return null;
  return { position: pos, buttonText: text };
}

/** Mini 2×3 grid showing which position was pressed (same order as main grid) */
function MiniPositionGrid({ pressedPosition }: { pressedPosition: ButtonPosition }) {
  return (
    <div className="grid grid-cols-2 grid-rows-3 gap-0.5 w-12 h-14 shrink-0" aria-hidden>
      {BUTTON_POSITIONS.map(({ position }) => (
        <div
          key={position}
          className={`rounded-sm border text-[10px] flex items-center justify-center font-bold ${
            position === pressedPosition
              ? "bg-success/30 border-success text-success"
              : "bg-base-300 border-base-content/20 text-base-content/40"
          }`}
        >
          {position === pressedPosition ? "✓" : ""}
        </div>
      ))}
    </div>
  );
}

export default function WhosOnFirstSolver({ bomb }: WhosOnFirstSolverProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [displayWord, setDisplayWord] = useState("");
  const [buttons, setButtons] = useState<Record<ButtonPosition, string>>({
    TOP_LEFT: "",
    TOP_RIGHT: "",
    MIDDLE_LEFT: "",
    MIDDLE_RIGHT: "",
    BOTTOM_LEFT: "",
    BOTTOM_RIGHT: "",
  });
  const [solution, setSolution] = useState<{ position: ButtonPosition; buttonText: string } | null>(null);
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);
  const [stageHistory, setStageHistory] = useState<{ stage: number; displayWord: string; position: ButtonPosition; buttonText: string }[]>([]);

  // Use the common solver hook for shared state
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
    () => ({ currentStage, displayWord, buttons, solution, twitchCommands, stageHistory }),
    [currentStage, displayWord, buttons, solution, twitchCommands, stageHistory],
  );

  const onRestoreState = useCallback((state: unknown) => {
    if (isWhosOnFirstApiState(state)) {
      const { displayHistory, buttonHistory, buttonPressHistory } = state;
      const stageCount = displayHistory.length;
      setCurrentStage(Math.min(stageCount + 1, 3));
      setDisplayWord("");
      setButtons(
        stageCount > 0 && buttonHistory[stageCount - 1]
          ? { ...EMPTY_BUTTONS, ...buttonHistory[stageCount - 1] }
          : EMPTY_BUTTONS
      );
      const history: { stage: number; displayWord: string; position: ButtonPosition; buttonText: string }[] = [];
      for (let i = 0; i < stageCount; i++) {
        const displayWord = displayHistory[i] ?? "";
        const press = buttonPressHistory[i] ? entryToPositionAndText(buttonPressHistory[i]) : null;
        if (press) {
          history.push({
            stage: i + 1,
            displayWord: displayWord === " " ? "[BLANK]" : displayWord,
            position: press.position,
            buttonText: press.buttonText,
          });
        }
      }
      setStageHistory(history);
      const lastPress =
        buttonPressHistory.length > 0
          ? entryToPositionAndText(buttonPressHistory[buttonPressHistory.length - 1])
          : null;
      setSolution(lastPress);
      setTwitchCommands([]);
      return;
    }
    const frontend = state as {
      currentStage?: number;
      displayWord?: string;
      buttons?: Record<ButtonPosition, string>;
      solution?: { position: ButtonPosition; buttonText: string } | null;
      twitchCommands?: string[];
      stageHistory?: { stage: number; displayWord: string; position: ButtonPosition; buttonText: string }[];
    };
    if (frontend.currentStage !== undefined) setCurrentStage(Math.min(frontend.currentStage ?? 1, 3));
    if (frontend.displayWord !== undefined) setDisplayWord(frontend.displayWord);
    if (frontend.buttons) setButtons(frontend.buttons);
    if (frontend.solution !== undefined) setSolution(frontend.solution);
    if (frontend.twitchCommands) setTwitchCommands(frontend.twitchCommands);
    if (frontend.stageHistory) setStageHistory(frontend.stageHistory);
  }, []);

  const onRestoreSolution = useCallback(
    (restored: { finalStage?: number } | number | { position: ButtonPosition; buttonText: string } | null) => {
      if (restored && typeof restored === "object" && "position" in restored && "buttonText" in restored) {
        setSolution(restored as { position: ButtonPosition; buttonText: string });
      }
      const finalStage = typeof restored === "number" ? restored : (restored as { finalStage?: number } | null)?.finalStage;
      if (finalStage) setCurrentStage(Math.min(finalStage, 3));
    },
    [],
  );

  useSolverModulePersistence<
    {
      currentStage: number;
      displayWord: string;
      buttons: Record<ButtonPosition, string>;
      solution: { position: ButtonPosition; buttonText: string } | null;
      twitchCommands: string[];
      stageHistory: { stage: number; displayWord: string; position: ButtonPosition; buttonText: string }[];
    },
    { finalStage?: number } | number | { position: ButtonPosition; buttonText: string }
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { position?: string; buttonText?: string; output?: unknown; finalStage?: unknown };
        if (typeof anyRaw.position === "string" && typeof anyRaw.buttonText === "string") {
          return { position: anyRaw.position as ButtonPosition, buttonText: anyRaw.buttonText };
        }
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as { finalStage?: number };
        if (typeof anyRaw.finalStage === "number") return { finalStage: anyRaw.finalStage };
      }
      if (typeof raw === "number") return raw;
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleDisplayWordChange = (value: string) => {
    // Allow empty display (can be " " or empty string)
    const processedValue = value === "" ? " " : value.toUpperCase();
    setDisplayWord(processedValue);
    clearError();
    setSolution(null);
    setTwitchCommands([]);
  };

  const handleButtonTextChange = (position: ButtonPosition, value: string) => {
    setButtons(prev => ({ ...prev, [position]: value.toUpperCase() }));
    clearError();
    setSolution(null);
    setTwitchCommands([]);
  };

  const handleCheckAnswer = async () => {
    // Empty display is valid - no validation needed for display word
    // Only validate that all button labels are filled
    const emptyButtons = Object.entries(buttons).filter(([, text]) => !text.trim());
    if (emptyButtons.length > 0) {
      setError("Please fill in all button labels");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const request: WhosOnFirstSolveRequest = {
        input: {
          displayWord: displayWord === " " ? " " : displayWord.trim(),
          buttons: Object.fromEntries(
            Object.entries(buttons).map(([pos, text]) => [pos, text.trim()])
          ) as Record<ButtonPosition, string>,
        }
      };

      const response = await solveWhosOnFirst(round.id, bomb.id, currentModule.id, request);
      
      setSolution(response.output);
      
      // Add to stage history
      const stageResult = {
        stage: currentStage,
        displayWord: displayWord === " " ? "[BLANK]" : displayWord.trim(),
        position: response.output.position,
        buttonText: response.output.buttonText
      };
      setStageHistory(prev => [...prev, stageResult]);
      
      // Generate Twitch command
      const positionName = response.output.position.replace('_', ' ');
      const command = generateTwitchCommand({
        moduleType: ModuleType.WHOS_ON_FIRST,
        result: { position: positionName, button: response.output.buttonText },
      });
      setTwitchCommands([command]);
      
      if (response.solved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
      } else if (currentStage < 3) {
        // Advance to next stage only when below stage 3
        setCurrentStage(currentStage + 1);
        setDisplayWord("");
        setSolution(null);
        setTwitchCommands([]);
        // Keep buttons as they might change in next stage
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Who's On First");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setCurrentStage(1);
    setDisplayWord("");
    setButtons({
      TOP_LEFT: "",
      TOP_RIGHT: "",
      MIDDLE_LEFT: "",
      MIDDLE_RIGHT: "",
      BOTTOM_LEFT: "",
      BOTTOM_RIGHT: "",
    });
    setSolution(null);
    setTwitchCommands([]);
    setStageHistory([]);
    resetSolverState();
  };


  const getButtonHighlight = (position: ButtonPosition) => {
    if (solution?.position === position && !isSolved) {
      return "ring-4 ring-success ring-opacity-90 bg-success/20 hover:bg-success/30 border-success motion-safe:animate-pulse-success";
    }
    return "bg-gray-700 hover:bg-gray-600";
  };

  const isSolutionCell = (position: ButtonPosition) =>
    Boolean(solution?.position === position && !isSolved);

  return (
    <SolverLayout>
      {/* Who's On First Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">
          MODULE VIEW - STAGE {Math.min(currentStage, 3)}/3
        </h3>
        
        {/* Display Screen */}
        <div className="mb-6">
          <div className="bg-black rounded-lg p-4 border-2 border-gray-600">
            <input
              type="text"
              value={displayWord === " " ? "" : displayWord}
              onChange={(e) => handleDisplayWordChange(e.target.value)}
              placeholder="Display word..."
              className="w-full bg-transparent text-center text-2xl font-mono text-green-400 placeholder-green-900 outline-none"
              disabled={isSolved || isLoading}
            />
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-4">
          {BUTTON_POSITIONS.map(({ position, label, gridClass }) => (
            <div key={position} className={gridClass}>
              <div className="text-xs text-gray-500 mb-1 text-center">{label}</div>
              <div
                className={`h-16 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center text-white font-bold text-sm px-2 ${
                  getButtonHighlight(position)
                } ${solution?.position === position && !isSolved ? "border-success" : "border-gray-600"}`}
              >
                {isSolutionCell(position) && (
                  <span className="text-success text-xs font-bold mb-0.5">✓ PRESS THIS</span>
                )}
                <input
                  type="text"
                  value={buttons[position]}
                  onChange={(e) => handleButtonTextChange(position, e.target.value)}
                  placeholder="..."
                  className="w-full bg-transparent text-center outline-none placeholder-gray-500 pointer-events-auto"
                  disabled={isSolved || isLoading}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stage history with mini position grid per row (shown for current and solved) */}
      {stageHistory.length > 0 && (
        <div className="bg-base-200 rounded-lg p-4 mb-4">
          <h3 className="text-center text-base-content/70 mb-3 text-sm font-medium">STAGE HISTORY</h3>
          <div className="space-y-2 text-sm">
            {stageHistory.map((stage, index) => (
              <div key={index} className="flex items-center gap-3 bg-base-100 rounded px-3 py-2">
                <MiniPositionGrid pressedPosition={stage.position} />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0 flex-1">
                  <span className="text-base-content/60 shrink-0">Stage {stage.stage}:</span>
                  <span className="text-base-content">
                    &quot;{stage.displayWord === "[BLANK]" ? "EMPTY" : stage.displayWord}&quot; → {stage.position.replace("_", " ")}
                  </span>
                  <span className="text-base-content/80 font-medium">&quot;{stage.buttonText}&quot;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solved-state summary: full sequence at a glance */}
      {isSolved && stageHistory.length > 0 && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-4 animate-fade-in">
          <h3 className="text-center text-success font-medium mb-3 text-sm">SOLVED — Sequence</h3>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            {stageHistory.map((stage, index) => (
              <div key={index} className="flex items-center gap-2">
                <MiniPositionGrid pressedPosition={stage.position} />
                <span className="text-base-content">
                  Stage {stage.stage}: {stage.position.replace("_", " ")} (&quot;{stage.buttonText}&quot;)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Word Reference */}
      {!isSolved && (
        <div className="bg-base-200 rounded p-3 mb-4">
          <p className="text-sm text-base-content/70 mb-2">Common words:</p>
          <div className="flex flex-wrap gap-1">
            {COMMON_WORDS.slice(0, 20).map((word) => (
              <button
                key={word}
                onClick={() => handleDisplayWordChange(word)}
                className="text-xs bg-base-300 hover:bg-base-400 px-2 py-1 rounded transition-colors"
                disabled={isSolved || isLoading}
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <SolverControls
        onSolve={handleCheckAnswer}
        onReset={reset}
        isSolveDisabled={Object.values(buttons).some(b => !b.trim())}
        isLoading={isLoading}
        solveText={isSolved ? "Module Solved" : Math.min(currentStage, 3) === 3 ? "Final Stage" : `Solve Stage ${Math.min(currentStage, 3)}`}
      />

      {/* Error display */}
      <ErrorAlert error={error} />

      {/* Current-stage answer: solution below inputs and controls */}
      {solution && !isSolved && (
        <div className="mb-4">
          <SolverResult
            variant="success"
            title={`Press: ${solution.position.replace("_", " ")} — "${solution.buttonText}"`}
            description={`Stage ${Math.min(currentStage, 3)} of 3`}
            className="mb-2"
          />
          <TwitchCommandDisplay command={twitchCommands} />
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Enter the word shown on the module display and the text on each of the 6 buttons.</p>
        <p className="mb-2">The display can be empty - leave the field blank if the display shows nothing.</p>
        <p className="mb-2">The solver will tell you which button to press. The module requires 3 correct presses to solve.</p>
        {!isSolved && currentStage > 1 && (
          <p className="text-yellow-600 font-medium mb-2">
            Stage {currentStage - 1} complete! Enter the new display word and check if buttons changed.
          </p>
        )}
      </div>
    </SolverLayout>
  );
}
