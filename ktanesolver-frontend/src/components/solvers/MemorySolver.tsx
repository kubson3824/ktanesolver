import { useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveMemory } from "../../services/memoryService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import ModuleNumberInput from "../ModuleNumberInput";

interface MemorySolverProps {
  bomb: BombEntity | null | undefined;
}

interface StageResult {
  stage: number;
  display: number;
  position: number;
  label: number;
}

export default function MemorySolver({ bomb }: MemorySolverProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [buttonLabels, setButtonLabels] = useState<number[]>([1, 2, 3, 4]);
  const [stageHistory, setStageHistory] = useState<StageResult[]>([]);
  const [result, setResult] = useState<{ position: number; label: number } | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const handleLabelChange = (position: number, label: number) => {
    if (isSolved) return;
    const newLabels = [...buttonLabels];
    newLabels[position] = label;
    setButtonLabels(newLabels);
  };

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    if (displayNumber === null || displayNumber < 1 || displayNumber > 4) {
      setError("Please enter a valid display number (1-4)");
      return;
    }

    if (buttonLabels.some(label => label < 1 || label > 4)) {
      setError("All button labels must be between 1 and 4");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await solveMemory(round.id, bomb.id, currentModule.id, {
        input: {
          stage: currentStage,
          display: displayNumber,
          labels: buttonLabels
        }
      });

      setResult(response.output);
      
      // Generate Twitch command for current stage
      const command = generateTwitchCommand({
        moduleType: ModuleType.MEMORY,
        result: response.output,
        moduleNumber
      });
      setTwitchCommand(command);
      
      const stageResult: StageResult = {
        stage: currentStage,
        display: displayNumber,
        position: response.output.position,
        label: response.output.label
      };
      
      const newHistory = [...stageHistory, stageResult];
      setStageHistory(newHistory);

      if (currentStage === 5) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
      } else {
        setCurrentStage(currentStage + 1);
        setDisplayNumber(null);
        setResult(null); // Clear result when advancing to next stage
        setTwitchCommand(""); // Clear Twitch command for next stage
        // Keep the same labels as they don't change between stages
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to solve memory module";
      
      // Handle invalid stage order error gracefully
      if (errorMessage.includes("Invalid stage order")) {
        setError("Module state out of sync. Please reset and try again from stage 1.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setCurrentStage(1);
    setDisplayNumber(null);
    setButtonLabels([1, 2, 3, 4]);
    setStageHistory([]);
    setResult(null);
    setIsSolved(false);
    setError("");
    setTwitchCommand("");
  };

  const renderButton = (position: number) => {
    const label = buttonLabels[position];
    const isHighlighted = result?.position === position + 1;

    return (
      <div key={position} className="flex flex-col items-center gap-2">
        <div className="text-xs text-gray-400">Position {position + 1}</div>
        <button
          className={`w-20 h-20 rounded-lg border-2 font-bold text-2xl transition-all ${
            isHighlighted
              ? "bg-green-600 border-green-400 text-white scale-105 shadow-lg shadow-green-600/50"
              : "bg-gray-700 border-gray-600 text-gray-200 hover:border-gray-500"
          } ${isSolved ? "cursor-not-allowed" : ""}`}
          disabled={isSolved}
        >
          {label}
        </button>
        <select
          value={label}
          onChange={(e) => handleLabelChange(position, parseInt(e.target.value))}
          disabled={isSolved}
          className="w-20 px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-gray-200 focus:border-primary focus:outline-none"
        >
          {[1, 2, 3, 4].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="w-full">
      <ModuleNumberInput />
      {/* Stage indicator */}
      <div className="bg-gray-900 rounded-lg p-4 mb-4">
        <h3 className="text-center text-gray-400 mb-2 text-sm font-medium">STAGE PROGRESS</h3>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(stage => (
            <div
              key={stage}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                stage < currentStage
                  ? "bg-green-600 text-white"
                  : stage === currentStage
                  ? "bg-primary text-primary-content"
                  : "bg-gray-700 text-gray-500"
              }`}
            >
              {stage < currentStage ? "✓" : stage}
            </div>
          ))}
        </div>
      </div>

      {/* Display number input */}
      <div className="bg-base-200 rounded-lg p-4 mb-4">
        <h3 className="text-center text-base-content/70 mb-3 text-sm font-medium">
          DISPLAY NUMBER
        </h3>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4].map(num => (
            <button
              key={num}
              onClick={() => !isSolved && setDisplayNumber(num)}
              disabled={isSolved}
              className={`w-16 h-16 rounded-lg border-2 font-bold text-xl transition-all ${
                displayNumber === num
                  ? "bg-primary border-primary text-primary-content"
                  : "bg-base-100 border-base-300 text-base-content hover:border-primary"
              } ${isSolved ? "cursor-not-allowed opacity-50" : ""}`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Module visualization - 4 buttons */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">MODULE VIEW</h3>
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map(position => renderButton(position))}
        </div>
        {result && !isSolved && (
          <div className="mt-4 text-center">
            <p className="text-green-400 text-sm font-medium">
              Press button at position {result.position} (label: {result.label})
            </p>
          </div>
        )}
      </div>

      {/* Twitch Command */}
      {twitchCommand && result && !isSolved && (
        <div className="bg-purple-900/20 border border-purple-500 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-purple-400 mb-1">Twitch Chat Command:</h4>
              <code className="text-lg font-mono text-purple-200">{twitchCommand}</code>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(twitchCommand);
              }}
              className="btn btn-sm btn-outline btn-purple"
              title="Copy to clipboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Stage history */}
      {stageHistory.length > 0 && (
        <div className="bg-base-200 rounded-lg p-4 mb-4">
          <h3 className="text-center text-base-content/70 mb-3 text-sm font-medium">STAGE HISTORY</h3>
          <div className="space-y-2 text-sm">
            {stageHistory.map((stage, index) => (
              <div key={index} className="flex justify-between items-center bg-base-100 rounded px-3 py-2">
                <span className="text-base-content/60">Stage {stage.stage}:</span>
                <span className="text-base-content">Display {stage.display} → Press position {stage.position}</span>
                <span className="text-base-content/60">(label {stage.label})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleSolve}
          className="btn btn-primary flex-1"
          disabled={isLoading || isSolved || displayNumber === null}
        >
          {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
          {isLoading ? "Solving..." : isSolved ? "Module Solved" : currentStage === 5 ? "Final Stage" : `Solve Stage ${currentStage}`}
        </button>
        <button onClick={reset} className="btn btn-outline" disabled={isLoading}>
          Reset
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error mb-4">
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
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Select the number shown on the display. Set the labels on each button (1-4).</p>
        <p>Press solve to determine which button to press. The module has 5 stages.</p>
      </div>
    </div>
  );
}
