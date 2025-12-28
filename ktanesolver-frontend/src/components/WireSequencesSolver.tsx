import { useState } from "react";
import type { BombEntity } from "../types";
import { ModuleType } from "../types";
import { 
  solveWireSequences, 
  type WireSequenceCombo, 
  type WireColor,
  type WireSequencesSolveRequest 
} from "../services/wireSequencesService";
import { useRoundStore } from "../store/useRoundStore";
import { generateTwitchCommand } from "../utils/twitchCommands";
import ModuleNumberInput from "./ModuleNumberInput";

interface WireSequencesSolverProps {
  bomb: BombEntity | null | undefined;
}

const WIRE_COLORS: { color: WireColor; display: string; className: string }[] = [
  { color: "RED", display: "Red", className: "bg-red-500" },
  { color: "BLUE", display: "Blue", className: "bg-blue-500" },
  { color: "BLACK", display: "Black", className: "bg-gray-900" },
];

const LETTERS: { letter: "A" | "B" | "C"; display: string }[] = [
  { letter: "A", display: "A" },
  { letter: "B", display: "B" },
  { letter: "C", display: "C" },
];

export default function WireSequencesSolver({ bomb }: WireSequencesSolverProps) {
  const [wires, setWires] = useState<WireSequenceCombo[]>([]);
  const [currentStage, setCurrentStage] = useState(1);
  const [solution, setSolution] = useState<boolean[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);
  const [moduleState, setModuleState] = useState({
    redCount: 0,
    blueCount: 0,
    blackCount: 0,
  });
  const [stageSolved, setStageSolved] = useState(false);

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const addWire = (color: WireColor, letter: "A" | "B" | "C") => {
    if (wires.length >= 3) {
      setError("Maximum 3 wires per stage");
      return;
    }
    const newWire: WireSequenceCombo = { color, letter };
    setWires([...wires, newWire]);
    setError("");
    setSolution([]);
    setTwitchCommands([]);
  };

  const removeWire = (index: number) => {
    setWires(wires.filter((_, i) => i !== index));
    setError("");
    setSolution([]);
    setTwitchCommands([]);
  };

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    if (wires.length === 0) {
      setError("At least 1 wire is required to solve a stage");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const request: WireSequencesSolveRequest = {
        input: {
          wires,
          stage: currentStage,
        }
      };

      const response = await solveWireSequences(round.id, bomb.id, currentModule.id, request);
      
      setSolution(response.output.cut);
      
      // Update module state for display
      const newRedCount = moduleState.redCount + wires.filter(w => w.color === "RED").length;
      const newBlueCount = moduleState.blueCount + wires.filter(w => w.color === "BLUE").length;
      const newBlackCount = moduleState.blackCount + wires.filter(w => w.color === "BLACK").length;
      
      setModuleState({
        redCount: newRedCount,
        blueCount: newBlueCount,
        blackCount: newBlackCount,
      });

      // Generate Twitch commands for wires to cut
      const commands: string[] = [];
      response.output.cut.forEach((shouldCut, index) => {
        if (shouldCut && index < wires.length) {
          const command = generateTwitchCommand({
            moduleType: ModuleType.WIRE_SEQUENCES,
            result: { 
              action: "cut", 
              wire: wires[index],
              wirePosition: index + 1,
              stage: currentStage 
            },
            moduleNumber
          });
          commands.push(command);
        }
      });
      setTwitchCommands(commands);

      if (response.solved) {
        setIsSolved(true);
        setStageSolved(false); // Don't show next stage button when module is fully solved
        markModuleSolved(bomb.id, currentModule.id);
      } else {
        // Mark stage as solved but don't progress automatically
        setStageSolved(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Wire Sequences");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setWires([]);
    setCurrentStage(1);
    setSolution([]);
    setIsSolved(false);
    setError("");
    setTwitchCommands([]);
    setModuleState({
      redCount: 0,
      blueCount: 0,
      blackCount: 0,
    });
    setStageSolved(false);
  };

  const nextStage = () => {
    setCurrentStage(currentStage + 1);
    setWires([]);
    setSolution([]);
    setError("");
    setTwitchCommands([]);
    setStageSolved(false);
  };

  return (
    <div className="w-full">
      <ModuleNumberInput />
      
      {/* Wire Sequences Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">
          WIRE SEQUENCES MODULE
        </h3>
        
        {/* Stage Indicator */}
        <div className="mb-6 text-center">
          <span className="text-sm text-gray-400">Stage: </span>
          <span className="text-lg font-bold text-white">{currentStage}/4</span>
        </div>

        {/* Wire Counters */}
        <div className="mb-6 flex justify-center gap-6">
          <div className="text-center">
            <div className="w-8 h-8 bg-red-500 rounded-full mx-auto mb-1"></div>
            <span className="text-xs text-gray-400">Red: {moduleState.redCount}</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-1"></div>
            <span className="text-xs text-gray-400">Blue: {moduleState.blueCount}</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-gray-900 rounded-full mx-auto mb-1"></div>
            <span className="text-xs text-gray-400">Black: {moduleState.blackCount}</span>
          </div>
        </div>

        {/* Wire Input */}
        {!isSolved && !stageSolved && (
          <div className="mb-6">
            <h4 className="text-sm text-gray-400 mb-3">
              Add Wires ({wires.length}/3):
            </h4>
            <div className="space-y-2">
              {WIRE_COLORS.map(color => (
                <div key={color.color} className="flex gap-2 items-center">
                  <div className={`w-6 h-6 rounded ${color.className}`}></div>
                  <span className="text-sm text-gray-300 w-12">{color.display}</span>
                  {LETTERS.map(letter => (
                    <button
                      key={`${color.color}-${letter.letter}`}
                      onClick={() => addWire(color.color, letter.letter)}
                      className="btn btn-xs btn-outline"
                      disabled={isLoading || wires.length >= 3}
                    >
                      {letter.display}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Wires */}
        <div className="mb-6">
          <h4 className="text-sm text-gray-400 mb-3">
            {isSolved ? "All Wires:" : `Stage ${currentStage} Wires:`}
          </h4>
          {wires.length === 0 && !isSolved ? (
            <p className="text-center text-gray-500 text-sm">Add exactly 3 wires to solve this stage</p>
          ) : (
            <div className="space-y-2">
              {wires.map((wire, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-700 rounded">
                  <span className="text-sm text-gray-400 w-8">#{index + 1}</span>
                  <div className={`w-6 h-6 rounded ${
                    wire.color === "RED" ? "bg-red-500" :
                    wire.color === "BLUE" ? "bg-blue-500" :
                    "bg-gray-900"
                  }`}></div>
                  <span className="text-white font-medium">{wire.letter}</span>
                  {!isSolved && (
                    <button
                      onClick={() => removeWire(index)}
                      className="btn btn-xs btn-outline btn-error ml-auto"
                      disabled={isLoading}
                    >
                      Remove
                    </button>
                  )}
                  {solution[index] !== undefined && (
                    <span className={`ml-auto text-sm font-medium ${
                      solution[index] ? "text-green-400" : "text-red-400"
                    }`}>
                      {solution[index] ? "CUT" : "DON'T CUT"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Solution Display */}
        {solution.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm text-gray-400 mb-2">Instructions:</h4>
            <div className="space-y-1">
              {wires.map((wire, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Wire #{index + 1}:</span>
                  <span className={solution[index] ? "text-green-400" : "text-red-400"}>
                    {solution[index] ? "Cut the wire" : "Don't cut the wire"}
                  </span>
                </div>
              ))}
            </div>

            {/* Twitch Commands */}
            {twitchCommands.length > 0 && (
              <div className="bg-purple-900/20 border border-purple-500 rounded-lg p-3 mt-3">
                <h4 className="text-sm font-medium text-purple-400 mb-2">Twitch Chat Commands:</h4>
                <div className="space-y-1">
                  {twitchCommands.map((command, index) => (
                    <div key={index} className="flex items-center justify-between gap-2">
                      <code className="text-sm font-mono text-purple-200">{command}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(command);
                        }}
                        className="btn btn-xs btn-outline btn-purple"
                        title="Copy to clipboard"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        {!stageSolved && !isSolved ? (
          <button
            onClick={handleSolve}
            className="btn btn-primary flex-1"
            disabled={isLoading || wires.length === 0}
          >
            {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
            {isLoading ? "Solving..." : currentStage === 4 ? "Final Stage" : `Solve Stage ${currentStage}`}
          </button>
        ) : stageSolved && !isSolved ? (
          <button
            onClick={nextStage}
            className="btn btn-primary flex-1"
            disabled={isLoading}
          >
            {currentStage === 4 ? "Module Complete" : `Next Stage (${currentStage + 1}/4)`}
          </button>
        ) : (
          <button
            className="btn btn-primary flex-1"
            disabled={true}
          >
            Module Solved
          </button>
        )}
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
        <p className="mb-2">Wire Sequences has 4 stages. For each wire:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Select the wire color (Red, Blue, or Black)</li>
          <li>Select the letter label (A, B, or C)</li>
          <li>Click "Solve Stage" to get instructions</li>
          <li>The module tracks wire counts across all stages</li>
          <li>Complete all 4 stages to finish the module</li>
        </ul>
      </div>
    </div>
  );
}
