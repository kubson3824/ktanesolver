import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { solveWhosOnFirst, type ButtonPosition, type WhosOnFirstSolveRequest } from "../../services/whosOnFirstService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ModuleType } from "../../types";
import { 
  useSolver,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  BombInfoDisplay,
  SolverControls
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
    moduleNumber
  } = useSolver();

  // Save state to module when inputs change
  const saveState = () => {
    if (currentModule) {
      const moduleState = {
        currentStage,
        displayWord,
        buttons,
        solution,
        twitchCommands,
        stageHistory
      };
      // Update the module in the store
      useRoundStore.getState().round?.bombs.forEach(bomb => {
        if (bomb.id === currentModule.bomb.id) {
          const module = bomb.modules.find(m => m.id === currentModule.id);
          if (module) {
            module.state = moduleState;
          }
        }
      });
    }
  };

  // Update state when inputs change
  useEffect(() => {
    saveState();
  }, [currentStage, displayWord, buttons, solution, twitchCommands, stageHistory]);

  // Restore state from module when component loads
  useEffect(() => {
    if (currentModule?.state && typeof currentModule.state === 'object') {
      const moduleState = currentModule.state as { 
        currentStage?: number;
        displayWord?: string;
        buttons?: Record<ButtonPosition, string>;
        solution?: { position: ButtonPosition; buttonText: string } | null;
        twitchCommands?: string[];
        stageHistory?: { stage: number; displayWord: string; position: ButtonPosition; buttonText: string }[];
      };
      
      if (moduleState.currentStage !== undefined) setCurrentStage(moduleState.currentStage);
      if (moduleState.displayWord !== undefined) setDisplayWord(moduleState.displayWord);
      if (moduleState.buttons) setButtons(moduleState.buttons);
      if (moduleState.solution !== undefined) setSolution(moduleState.solution);
      if (moduleState.twitchCommands) setTwitchCommands(moduleState.twitchCommands);
      if (moduleState.stageHistory) setStageHistory(moduleState.stageHistory);
    }

    // Restore solution if module was solved
    if (currentModule?.solution && typeof currentModule.solution === 'object') {
      const solution = currentModule.solution as { 
        isSolved?: boolean;
        finalStage?: number;
      };
      
      if (solution.isSolved) {
        setIsSolved(true);
        if (solution.finalStage) {
          setCurrentStage(solution.finalStage);
        }
      }
    }
  }, [currentModule, moduleNumber, setIsSolved]);

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
        moduleNumber
      });
      setTwitchCommands([command]);
      
      if (response.solved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        
        // Save solution
        if (currentModule) {
          useRoundStore.getState().round?.bombs.forEach(bomb => {
            if (bomb.id === currentModule.bomb.id) {
              const module = bomb.modules.find(m => m.id === currentModule.id);
              if (module) {
                module.solution = { isSolved: true, finalStage: currentStage };
              }
            }
          });
        }
      } else {
        // Advance to next stage
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
    if (solution?.position === position) {
      return "ring-4 ring-green-500 ring-opacity-75 bg-green-600 hover:bg-green-500";
    }
    return "bg-gray-700 hover:bg-gray-600";
  };

  return (
    <SolverLayout>
      {/* Who's On First Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">
          MODULE VIEW - STAGE {currentStage}/3
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
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-6">
          {BUTTON_POSITIONS.map(({ position, label, gridClass }) => (
            <div key={position} className={gridClass}>
              <div className="text-xs text-gray-500 mb-1 text-center">{label}</div>
              <button
                className={`h-16 rounded-lg border-2 border-gray-600 transition-all duration-200 flex items-center justify-center text-white font-bold text-sm px-2 ${getButtonHighlight(position)}`}
                disabled={isSolved || isLoading}
              >
                <input
                  type="text"
                  value={buttons[position]}
                  onChange={(e) => handleButtonTextChange(position, e.target.value)}
                  placeholder="..."
                  className="w-full bg-transparent text-center outline-none placeholder-gray-500"
                  disabled={isSolved || isLoading}
                  onClick={(e) => e.stopPropagation()}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Solution */}
        {solution && !isSolved && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-center text-green-400 mb-2 text-sm font-medium">Press:</p>
            <div className="flex justify-center mb-3">
              <div className="bg-green-900/50 border border-green-600 rounded-lg px-4 py-3">
                <p className="text-green-300 text-sm font-bold">
                  {solution.position.replace('_', ' ')} - "{solution.buttonText}"
                </p>
              </div>
            </div>

            {/* Twitch command display */}
            <TwitchCommandDisplay command={twitchCommands} className="mb-0" />
          </div>
        )}
      </div>

      {/* Stage history */}
      {stageHistory.length > 0 && (
        <div className="bg-base-200 rounded-lg p-4 mb-4">
          <h3 className="text-center text-base-content/70 mb-3 text-sm font-medium">STAGE HISTORY</h3>
          <div className="space-y-2 text-sm">
            {stageHistory.map((stage, index) => (
              <div key={index} className="flex justify-between items-center bg-base-100 rounded px-3 py-2">
                <span className="text-base-content/60">Stage {stage.stage}:</span>
                <span className="text-base-content">"{stage.displayWord === "[BLANK]" ? "[EMPTY]" : stage.displayWord}" → {stage.position.replace('_', ' ')}</span>
                <span className="text-base-content/60">("{stage.buttonText}")</span>
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

      {/* Bomb info display */}
      <BombInfoDisplay bomb={bomb} />
      
      {/* Controls */}
      <SolverControls
        onSolve={handleCheckAnswer}
        onReset={reset}
        isSolveDisabled={Object.values(buttons).some(b => !b.trim())}
        isLoading={isLoading}
        solveText={isSolved ? "Module Solved" : currentStage === 3 ? "Final Stage" : `Solve Stage ${currentStage}`}
      />

      {/* Error display */}
      <ErrorAlert error={error} />

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
    </div>
  );
}
