import { useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveConnectionCheck } from "../../services/connectionCheckService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import ModuleNumberInput from "../ModuleNumberInput";

interface NumberPair {
  one: number;
  two: number;
}

interface ConnectionCheckSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function ConnectionCheckSolver({ bomb }: ConnectionCheckSolverProps) {
  const [pairs, setPairs] = useState<NumberPair[]>([
    { one: 0, two: 0 },
    { one: 0, two: 0 },
    { one: 0, two: 0 },
    { one: 0, two: 0 },
  ]);
  const [result, setResult] = useState<boolean[]>([false, false, false, false]);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");
  
  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const handlePairChange = (index: number, field: 'one' | 'two', value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(1, Math.min(8, numValue));
    
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [field]: clampedValue };
    setPairs(newPairs);
  };

  const solveModule = async () => {
    setError("");
    setIsLoading(true);

    // Validate all pairs are filled
    const hasInvalidPairs = pairs.some(pair => pair.one === 0 || pair.two === 0);
    if (hasInvalidPairs) {
      setError("Please fill in all number pairs (values 1-8)");
      setIsLoading(false);
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      setIsLoading(false);
      return;
    }

    try {
      const response = await solveConnectionCheck(
        round.id,
        bomb.id,
        currentModule.id,
        { input: { pairs } }
      );

      const ledStates = [
        response.output.led1,
        response.output.led2,
        response.output.led3,
        response.output.led4,
      ];
      
      setResult(ledStates);
      setIsSolved(true);
      
      // Generate Twitch command
      const command = generateTwitchCommand({
        moduleType: ModuleType.CONNECTION_CHECK,
        result: { ledStates: ledStates },
        moduleNumber
      });
      setTwitchCommand(command);
      
      markModuleSolved(bomb.id, currentModule.id);
    } catch (err: any) {
      setError(err.message || "Failed to solve module");
    } finally {
      setIsLoading(false);
    }
  };

  const resetModule = () => {
    setPairs([
      { one: 0, two: 0 },
      { one: 0, two: 0 },
      { one: 0, two: 0 },
      { one: 0, two: 0 },
    ]);
    setResult([false, false, false, false]);
    setIsSolved(false);
    setError("");
    setTwitchCommand("");
  };

  return (
    <div className="w-full">
      <ModuleNumberInput />
      
      {/* Connection Check Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">CONNECTION CHECK MODULE</h3>
        
        {/* Serial Number Display */}
        {bomb?.serialNumber && (
          <div className="mb-6 p-3 bg-gray-900 rounded border border-gray-700">
            <span className="font-semibold text-gray-300">Serial Number:</span>
            <span className="ml-2 text-green-400 font-mono">{bomb.serialNumber}</span>
          </div>
        )}
        
        <p className="text-gray-400 text-center mb-6">
          Enter the 4 number pairs displayed on the module (1-8)
        </p>

        {/* Number Pairs Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {pairs.map((pair, index) => (
            <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-gray-300 text-lg">Pair {index + 1}:</span>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={pair.one || ''}
                  onChange={(e) => handlePairChange(index, 'one', e.target.value)}
                  className="w-16 px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSolved}
                />
                <span className="text-gray-500 text-xl">—</span>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={pair.two || ''}
                  onChange={(e) => handlePairChange(index, 'two', e.target.value)}
                  className="w-16 px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSolved}
                />
              </div>
            </div>
          ))}
        </div>

      {/* Bomb info display */}
      <div className="bg-base-200 rounded p-3 mb-4">
        <p className="text-sm text-base-content/70">
          Serial Number: <span className="font-mono font-bold">{bomb?.serialNumber || "Unknown"}</span>
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={solveModule}
          className="btn btn-primary flex-1"
          disabled={isLoading || isSolved || pairs.some(p => p.one === 0 || p.two === 0)}
        >
          {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
          {isLoading ? "Solving..." : "Solve"}
        </button>
        <button onClick={resetModule} className="btn btn-outline" disabled={isLoading}>
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
      {isSolved && (
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
          <div className="w-full">
            <span className="font-bold mb-3 block text-lg">LED States:</span>
            <div className="grid grid-cols-4 gap-4">
              {result.map((led, index) => (
                <div key={index} className="text-center bg-gray-900 rounded-lg p-4 border-2 border-gray-700 shadow-lg">
                  <div className="text-sm font-medium text-gray-400 mb-2">LED {index + 1}</div>
                  <div className={`text-3xl font-bold ${
                    led ? 'text-lime-400' : 'text-gray-500'
                  }`}>
                    {led ? 'ON' : 'OFF'}
                  </div>
                  <div className={`mt-2 w-full h-2 rounded-full ${
                    led ? 'bg-lime-400' : 'bg-gray-600'
                  }`}></div>
                </div>
              ))}
            </div>
          </div>
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
      </div>
    </div>
  );
}
