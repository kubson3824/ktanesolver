import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveMemory } from "../../services/memoryService";
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

interface MemorySolverProps {
  bomb: BombEntity | null | undefined;
}

interface StageResult {
  stage: number;
  display: number;
  position: number;
  label: number;
}

/** Mini 4-cell grid for Memory: positions 1–4, one cell highlighted with its label. */
function MemoryMiniGrid({ position, label }: { position: number; label: number }) {
  return (
    <div className="flex gap-0.5 w-24 h-8 shrink-0" aria-hidden>
      {[1, 2, 3, 4].map((pos) => (
        <div
          key={pos}
          className={`flex-1 rounded border text-sm font-bold flex items-center justify-center ${
            pos === position
              ? "bg-success/30 border-success text-success"
              : "bg-base-300 border-base-content/20 text-base-content/40"
          }`}
        >
          {pos === position ? label : ""}
        </div>
      ))}
    </div>
  );
}

export default function MemorySolver({ bomb }: MemorySolverProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [buttonLabels, setButtonLabels] = useState<number[]>([1, 2, 3, 4]);
  const [stageHistory, setStageHistory] = useState<StageResult[]>([]);
  const [result, setResult] = useState<{ position: number; label: number } | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

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
    () => ({ currentStage, displayNumber, buttonLabels, stageHistory, result, twitchCommand }),
    [currentStage, displayNumber, buttonLabels, stageHistory, result, twitchCommand],
  );

  // One Twitch command per stage: from completed stageHistory + current stage if we have result/twitchCommand
  const displayTwitchCommands = useMemo(() => {
    const list = stageHistory.map((s) =>
      generateTwitchCommand({
        moduleType: ModuleType.MEMORY,
        result: { position: s.position, label: s.label },
      })
    );
    if (result && twitchCommand) list.push(twitchCommand);
    return list;
  }, [stageHistory, result, twitchCommand]);

  const onRestoreState = useCallback(
    (state: {
      currentStage?: number;
      displayNumber?: number | null;
      buttonLabels?: number[];
      stageHistory?: StageResult[];
      result?: { position: number; label: number } | null;
      twitchCommand?: string;
      displayHistory?: number[];
      solutionHistory?: { position: number; label: number }[];
    }) => {
      const raw = state as Record<string, unknown>;
      const hasBackendShape =
        Array.isArray(raw.displayHistory) && Array.isArray(raw.solutionHistory);

      if (hasBackendShape) {
        const displayHistory = raw.displayHistory as number[];
        const solutionHistory = raw.solutionHistory as { position: number; label: number }[];
        const stage = Math.min((displayHistory.length || 0) + 1, 5);
        setCurrentStage(stage);
        setStageHistory(
          solutionHistory.map((step, i) => ({
            stage: i + 1,
            display: displayHistory[i] ?? 0,
            position: step.position,
            label: step.label,
          }))
        );
        setDisplayNumber(null);
        setResult(null);
        setTwitchCommand("");
        if (state.buttonLabels && state.buttonLabels.length === 4) setButtonLabels(state.buttonLabels);
      } else {
        if (state.currentStage !== undefined)
          setCurrentStage(Math.min(state.currentStage, 5));
        if (state.displayNumber !== undefined) setDisplayNumber(state.displayNumber);
        if (state.buttonLabels) setButtonLabels(state.buttonLabels);
        if (state.stageHistory) setStageHistory(state.stageHistory);
        if (state.result !== undefined) setResult(state.result);
        if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
      }
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: { position: number; label: number }) => {
      if (!solution) return;
      setResult(solution);
      setCurrentStage(5); // Final stage; never > 5
    },
    [],
  );

  useSolverModulePersistence<
    { currentStage: number; displayNumber: number | null; buttonLabels: number[]; stageHistory: StageResult[]; result: { position: number; label: number } | null; twitchCommand: string },
    { position: number; label: number }
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; finalResult?: unknown; position?: number; label?: number };
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as { position: number; label: number };
        if (anyRaw.finalResult && typeof anyRaw.finalResult === "object") return anyRaw.finalResult as { position: number; label: number };
        // Backend stores MemoryOutput as flat map: { position, label }
        if (typeof anyRaw.position === "number" && typeof anyRaw.label === "number") return { position: anyRaw.position, label: anyRaw.label };
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

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

    if (currentStage > 5) {
      setError("Memory module has only 5 stages. Please reset and try again.");
      return;
    }

    setIsLoading(true);
    clearError();

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

      if (response.solved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        setDisplayNumber(null);
        // Keep result and twitchCommand visible when solved so user can see/copy the final answer
      } else {
        setCurrentStage(Math.min(currentStage + 1, 5));
        setDisplayNumber(null);
        setResult(null); // Clear result when advancing to next stage
        setTwitchCommand(""); // Clear Twitch command for next stage
      }
      // Keep the same labels as they don't change between stages
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
    setTwitchCommand("");
    resetSolverState();
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
    <SolverLayout>
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

      {/* Display number input - inputs first */}
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

      {/* Module visualization - 4 buttons (input only; solution shown below) */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">MODULE VIEW</h3>
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map(position => renderButton(position))}
        </div>
      </div>

      {/* Controls */}
      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={displayNumber === null}
        isLoading={isLoading}
        solveText={isSolved ? "Module Solved" : currentStage === 5 ? "Final Stage" : `Solve Stage ${currentStage}`}
      />

      {/* Error display */}
      <ErrorAlert error={error} />

      {/* Stage history - output below inputs */}
      {stageHistory.length > 0 && (
        <div className="bg-base-200 rounded-lg p-4 mb-4">
          <h3 className="text-center text-base-content/70 mb-3 text-sm font-medium">STAGE HISTORY</h3>
          <div className="space-y-2 text-sm">
            {stageHistory.map((stage, index) => (
              <div key={index} className="flex flex-wrap items-center gap-3 bg-base-100 rounded-lg px-3 py-2">
                <span className="shrink-0 font-medium text-base-content/70">Stage {stage.stage}</span>
                <span className="shrink-0 text-base-content/60">Display <strong className="text-base-content">{stage.display}</strong></span>
                <MemoryMiniGrid position={stage.position} label={stage.label} />
                <span className="shrink-0 text-base-content/60">Position <strong className="text-base-content">{stage.position}</strong>, label <strong className="text-base-content">{stage.label}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solution - which button to press */}
      {result && !isSolved && (
        <SolverResult
          variant="success"
          title="Press this button"
          description={`Position ${result.position}, label ${result.label}`}
          className="mb-4"
        />
      )}

      {/* Twitch command display - one command per stage, all in one block */}
      {displayTwitchCommands.length > 0 && (
        <TwitchCommandDisplay command={displayTwitchCommands} />
      )}

      {/* Solved-state summary - full sequence at a glance */}
      {isSolved && stageHistory.length > 0 && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-4 animate-fade-in">
          <h3 className="text-center text-success font-medium mb-3 text-sm">SOLVED — Sequence</h3>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            {stageHistory.map((stage, index) => (
              <div key={index} className="flex items-center gap-2">
                <MemoryMiniGrid position={stage.position} label={stage.label} />
                <span className="text-base-content">
                  Stage {stage.stage}: position {stage.position}, label {stage.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Select the number shown on the display. Set the labels on each button (1-4).</p>
        <p>Press solve to determine which button to press. The module has 5 stages.</p>
      </div>
    </SolverLayout>
  );
}
