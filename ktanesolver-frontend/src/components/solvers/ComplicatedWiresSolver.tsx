import { useState } from "react";
import type { BombEntity } from "../../types";
import { 
  solveComplicatedWires, 
  type ComplicatedWire, 
  type ComplicatedWiresSolveRequest 
} from "../../services/complicatedWiresService";
import { useRoundStore } from "../../store/useRoundStore";
import { PortType } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import ModuleNumberInput from "../ModuleNumberInput";

interface ComplicatedWiresSolverProps {
  bomb: BombEntity | null | undefined;
}

interface WireState extends ComplicatedWire {
  id: number;
}

const DEFAULT_WIRES: WireState[] = [
  { id: 1, red: false, blue: false, led: false, star: false },
  { id: 2, red: false, blue: false, led: false, star: false },
  { id: 3, red: false, blue: false, led: false, star: false },
  { id: 4, red: false, blue: false, led: false, star: false },
  { id: 5, red: false, blue: false, led: false, star: false },
  { id: 6, red: false, blue: false, led: false, star: false },
];

export default function ComplicatedWiresSolver({ bomb }: ComplicatedWiresSolverProps) {
  const [wires, setWires] = useState<WireState[]>(DEFAULT_WIRES);
  const [wireCount, setWireCount] = useState(6);
  const [solution, setSolution] = useState<number[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const updateWire = (wireId: number, property: keyof ComplicatedWire, value: boolean) => {
    setWires(prev => 
      prev.map(wire => 
        wire.id === wireId ? { ...wire, [property]: value } : wire
      )
    );
    setError("");
    setSolution([]);
    setTwitchCommands([]);
  };

  const handleWireCountChange = (count: number) => {
    setWireCount(count);
    setWires(DEFAULT_WIRES.slice(0, count));
    setError("");
    setSolution([]);
    setTwitchCommands([]);
  };

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    // Validate that at least one wire exists
    if (wireCount === 0) {
      setError("Please select at least one wire");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const request: ComplicatedWiresSolveRequest = {
        input: {
          wires: wires.slice(0, wireCount).map(({ ...wire }) => wire)
        }
      };

      const response = await solveComplicatedWires(round.id, bomb.id, currentModule.id, request);
      
      setSolution(response.output.cutWires);
      
      // Generate Twitch commands
      const commands = response.output.cutWires.map(wireNum => 
        generateTwitchCommand({
          moduleType: ModuleType.COMPLICATED_WIRES,
          result: { action: "cut", wire: wireNum },
          moduleNumber
        })
      );
      setTwitchCommands(commands);
      
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Complicated Wires");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setWires(DEFAULT_WIRES);
    setWireCount(6);
    setSolution([]);
    setIsSolved(false);
    setError("");
    setTwitchCommands([]);
  };

  const getWireColor = (wire: WireState) => {
    if (wire.red && wire.blue) return "bg-gradient-to-r from-red-500 to-blue-500";
    if (wire.red) return "bg-red-500";
    if (wire.blue) return "bg-blue-500";
    return "bg-gray-500";
  };

  const shouldCutWire = (wireId: number) => {
    return solution.includes(wireId);
  };

  return (
    <div className="w-full">
      <ModuleNumberInput />
      
      {/* Complicated Wires Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">
          COMPLICATED WIRES MODULE
        </h3>
        
        {/* Wire Count Selector */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 block mb-2">Number of Wires:</label>
          <div className="flex gap-2">
            {[3, 4, 5, 6].map(count => (
              <button
                key={count}
                onClick={() => handleWireCountChange(count)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  wireCount === count 
                    ? "bg-primary text-primary-content" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                disabled={isSolved || isLoading}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Wires Grid */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          {wires.slice(0, wireCount).map((wire) => (
            <div key={wire.id} className="flex flex-col items-center">
              {/* Wire Number */}
              <div className="text-xs text-gray-500 mb-1">#{wire.id}</div>
              
              {/* LED */}
              <button
                onClick={() => updateWire(wire.id, 'led', !wire.led)}
                className={`w-8 h-8 rounded-full border-2 border-gray-600 mb-2 transition-all ${
                  wire.led 
                    ? "bg-yellow-400 shadow-lg shadow-yellow-400/50" 
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
                disabled={isSolved || isLoading}
                title="Toggle LED"
              >
                {wire.led && (
                  <div className="w-full h-full rounded-full bg-yellow-300 animate-pulse"></div>
                )}
              </button>

              {/* Wire */}
              <div className="relative mb-2">
                <div 
                  className={`w-8 h-32 rounded transition-all ${
                    getWireColor(wire)
                  } ${
                    shouldCutWire(wire.id) 
                      ? "ring-4 ring-green-500 ring-opacity-75" 
                      : ""
                  }`}
                />
                {shouldCutWire(wire.id) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 1 0 4.243 4.243 3 3 0 0 0-4.243-4.243zm0-5.758a3 3 0 1 0 4.243-4.243 3 3 0 0 0-4.243 4.243z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Star */}
              <button
                onClick={() => updateWire(wire.id, 'star', !wire.star)}
                className={`w-8 h-8 rounded border-2 border-gray-600 transition-all flex items-center justify-center ${
                  wire.star 
                    ? "bg-yellow-500 border-yellow-400" 
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
                disabled={isSolved || isLoading}
                title="Toggle Star"
              >
                {wire.star ? (
                  <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                )}
              </button>

              {/* Color Buttons */}
              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => updateWire(wire.id, 'red', !wire.red)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    wire.red 
                      ? "bg-red-500 border-red-400" 
                      : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                  }`}
                  disabled={isSolved || isLoading}
                  title="Toggle Red"
                />
                <button
                  onClick={() => updateWire(wire.id, 'blue', !wire.blue)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    wire.blue 
                      ? "bg-blue-500 border-blue-400" 
                      : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                  }`}
                  disabled={isSolved || isLoading}
                  title="Toggle Blue"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Solution */}
        {isSolved && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            {solution.length > 0 ? (
              <>
                <p className="text-center text-green-400 mb-2 text-sm font-medium">Cut wires:</p>
                <div className="flex justify-center gap-2 mb-3">
                  {solution.map(wireNum => (
                    <div key={wireNum} className="bg-green-900/50 border border-green-600 rounded-lg px-3 py-2">
                      <p className="text-green-300 font-bold">#{wireNum}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center mb-3">
                <p className="text-yellow-400 font-medium">Don't cut any wires!</p>
              </div>
            )}

            {/* Twitch Commands */}
            {twitchCommands.length > 0 && (
              <div className="bg-purple-900/20 border border-purple-500 rounded-lg p-3">
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

      {/* Bomb Info */}
      <div className="bg-base-200 rounded p-3 mb-4">
        <p className="text-sm text-base-content/70">
          Serial Number: <span className="font-mono font-bold">{bomb?.serialNumber || "Unknown"}</span>
        </p>
        <p className="text-sm text-base-content/70">
          Batteries: <span className="font-mono font-bold">{(bomb?.aaBatteryCount ?? 0) + (bomb?.dBatteryCount ?? 0)}</span>
        </p>
        <p className="text-sm text-base-content/70">
          Parallel Port: <span className="font-mono font-bold">
            {bomb?.portPlates?.some(plate => plate.ports.includes(PortType.PARALLEL)) ? "Yes" : "No"}
          </span>
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleSolve}
          className="btn btn-primary flex-1"
          disabled={isLoading || isSolved}
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

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Click on each wire component to toggle:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>LED: Yellow light above the wire</li>
          <li>Star: Star symbol below the wire</li>
          <li>Colors: Use red/blue buttons below each wire</li>
          <li>A wire can have both red and blue colors (creates striped pattern)</li>
        </ul>
      </div>
    </div>
  );
}
