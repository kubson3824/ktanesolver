import { useState, useEffect } from "react";
import type { BombEntity } from "../types";
import { ModuleType } from "../types";
import { solveWires as solveWiresApi } from "../services/wiresService";
import { useRoundStore } from "../store/useRoundStore";
import { generateTwitchCommand } from "../utils/twitchCommands";
import ModuleNumberInput from "./ModuleNumberInput";

type WireColor = "RED" | "BLUE" | "BLACK" | "YELLOW" | "WHITE" | null;

interface WireSolverProps {
  bomb: BombEntity | null | undefined;
}

const WIRE_COLORS: { color: WireColor; display: string; className: string }[] = [
  { color: "RED", display: "Red", className: "bg-red-500" },
  { color: "BLUE", display: "Blue", className: "bg-blue-500" },
  { color: "BLACK", display: "Black", className: "bg-gray-900" },
  { color: "YELLOW", display: "Yellow", className: "bg-yellow-400" },
  { color: "WHITE", display: "White", className: "bg-white border border-gray-300" },
  { color: null, display: "Empty", className: "bg-transparent" },
];

export default function WireSolver({ bomb }: WireSolverProps) {
  const [wires, setWires] = useState<WireColor[]>(Array(6).fill(null));
  const [result, setResult] = useState<string>("");
  const [wireToCut, setWireToCut] = useState<number>(-1);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");
  
  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  // Restore state from module when component loads or currentModule changes
  useEffect(() => {
    console.log('WireSolver: currentModule changed', currentModule);
    
    if (currentModule?.state && typeof currentModule.state === 'object') {
      const moduleState = currentModule.state as any;
      console.log('WireSolver: moduleState', moduleState);
      
      // Restore wire configuration
      if (moduleState.wires && Array.isArray(moduleState.wires)) {
        const restoredWires: WireColor[] = Array(6).fill(null);
        moduleState.wires.forEach((color: string, index: number) => {
          if (index < 6 && color) {
            // Ensure the color is valid
            if (["RED", "BLUE", "BLACK", "YELLOW", "WHITE"].includes(color)) {
              restoredWires[index] = color as WireColor;
            }
          }
        });
        setWires(restoredWires);
        console.log('WireSolver: Restored wires', restoredWires);
      }
    }
    
    // Restore solution if module was solved
    if (currentModule?.solution && typeof currentModule.solution === 'object') {
      const solution = currentModule.solution as any;
      console.log('WireSolver: solution', solution);
      
      if (solution.instruction) {
        setResult(solution.instruction);
      }
      if (solution.wirePosition !== undefined) {
        setWireToCut(solution.wirePosition);
      }
      if (solution.instruction || solution.wirePosition !== undefined) {
        setIsSolved(true);
        
        // Generate twitch command from the solution
        const command = generateTwitchCommand({
          moduleType: ModuleType.WIRES,
          result: {
            instruction: solution.instruction,
            wirePosition: solution.wirePosition
          },
          moduleNumber
        });
        setTwitchCommand(command);
      }
    }
  }, [currentModule, moduleNumber]);

  const solveWires = async () => {
    const activeWires = wires.filter((w) => w !== null);
    const wireCount = activeWires.length;

    if (wireCount < 3 || wireCount > 6) {
      setError("Invalid number of wires (must be 3-6)");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const wireColors: ("RED" | "BLUE" | "BLACK" | "YELLOW" | "WHITE")[] = activeWires as any;
      const response = await solveWiresApi(round.id, bomb.id, currentModule.id, {input: { wires: wireColors }});
      
      setResult(response.output.instruction);
      setWireToCut(response.output.wirePosition);
      setIsSolved(true);
      
      // Generate Twitch command
      const command = generateTwitchCommand({
        moduleType: ModuleType.WIRES,
        result: response.output,
        moduleNumber
      });
      setTwitchCommand(command);
      
      // Mark module as solved in the store
      markModuleSolved(bomb.id, currentModule.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve wires");
    } finally {
      setIsLoading(false);
    }
  };

  const cycleWireColor = (index: number) => {
    const currentColor = wires[index];
    const currentIndex = WIRE_COLORS.findIndex((w) => w.color === currentColor);
    const nextIndex = (currentIndex + 1) % WIRE_COLORS.length;
    const newWires = [...wires];
    newWires[index] = WIRE_COLORS[nextIndex].color;
    setWires(newWires);
    setIsSolved(false);
    setResult("");
    setWireToCut(-1);
    setError("");
    
    // Save current wire configuration to module state
    if (currentModule && newWires.some(w => w !== null)) {
      const moduleState = {
        wires: newWires.filter(w => w !== null)
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

  const reset = () => {
    setWires(Array(6).fill(null));
    setResult("");
    setWireToCut(-1);
    setIsSolved(false);
    setError("");
    setTwitchCommand("");
    
    // Clear module state
    if (currentModule) {
      useRoundStore.getState().round?.bombs.forEach(bomb => {
        if (bomb.id === currentModule.bomb.id) {
          const module = bomb.modules.find(m => m.id === currentModule.id);
          if (module) {
            module.state = {};
            module.solution = {};
          }
        }
      });
    }
  };

  return (
    <div className="w-full">
      <ModuleNumberInput />
      {/* Bomb module visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <div className="space-y-3">
          {wires.map((wire, index) => (
            <div key={index} className="flex items-center gap-3">
              {/* Left port */}
              <div className="w-4 h-4 bg-gray-600 rounded-full border-2 border-gray-500"></div>
              
              {/* Wire */}
              <button
                onClick={() => cycleWireColor(index)}
                className={`flex-1 h-8 rounded transition-all duration-200 ${
                  wire
                    ? WIRE_COLORS.find((w) => w.color === wire)?.className || ""
                    : "bg-gray-700 hover:bg-gray-600"
                } ${wire ? "shadow-lg" : ""} ${
                  isSolved && wireToCut === index
                    ? "ring-4 ring-green-400 ring-opacity-75"
                    : ""
                }`}
                disabled={isSolved}
              >
                {wire && (
                  <span className={`text-xs font-medium ${wire === 'WHITE' || wire === 'YELLOW' ? 'text-black' : 'text-white'}`}>
                    {index + 1}{index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th"}
                  </span>
                )}
              </button>
              
              {/* Right port */}
              <div className="w-4 h-4 bg-gray-600 rounded-full border-2 border-gray-500"></div>
              
              {/* Wire number label */}
              <span className="text-gray-400 text-sm w-12">
                {index + 1}{index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Serial number display */}
      <div className="bg-base-200 rounded p-3 mb-4">
        <p className="text-sm text-base-content/70">
          Serial Number: <span className="font-mono font-bold">{bomb?.serialNumber || "Unknown"}</span>
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={solveWires}
          className="btn btn-primary flex-1"
          disabled={wires.filter((w) => w !== null).length < 3 || isLoading}
        >
          {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
          {isLoading ? "Solving..." : "Solve Wires"}
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

      {/* Twitch Command */}
      {twitchCommand && (
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

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Click on each wire slot to cycle through colors:</p>
        <div className="flex flex-wrap gap-2">
          {WIRE_COLORS.filter((w) => w.color !== null).map((wire) => (
            <div key={wire.color} className="flex items-center gap-1">
              <div className={`w-4 h-4 rounded ${wire.className}`}></div>
              <span className="text-xs">{wire.display}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
