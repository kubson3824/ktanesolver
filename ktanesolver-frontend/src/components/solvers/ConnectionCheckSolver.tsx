import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveConnectionCheck } from "../../services/connectionCheckService";
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
    moduleNumber
  } = useSolver();

  const handlePairChange = (index: number, field: 'one' | 'two', value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(1, Math.min(8, numValue));
    
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [field]: clampedValue };
    setPairs(newPairs);
    
    // Save state to module
    if (currentModule) {
      const moduleState = { pairs: newPairs };
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

  // Restore state from module when component loads
  useEffect(() => {
    if (currentModule?.state && typeof currentModule.state === 'object') {
      const moduleState = currentModule.state as { pairs?: NumberPair[] };
      
      if (moduleState.pairs) {
        setPairs(moduleState.pairs);
      }
    }

    // Restore solution if module was solved
    if (currentModule?.solution && typeof currentModule.solution === 'object') {
      const solution = currentModule.solution as { ledStates?: boolean[] };
      
      if (solution.ledStates) {
        setResult(solution.ledStates);
        setIsSolved(true);

        // Generate twitch command from the solution
        const command = generateTwitchCommand({
          moduleType: ModuleType.CONNECTION_CHECK,
          result: { ledStates: solution.ledStates },
          moduleNumber
        });
        setTwitchCommand(command);
      }
    }
  }, [currentModule, moduleNumber, setIsSolved]);

  const solveModule = async () => {
    clearError();
    setIsLoading(true);

    // Validate all pairs are filled
    const hasInvalidPairs = pairs.some(pair => pair.one === 0 || pair.two === 0);
    if (hasInvalidPairs) {
      setError("Please fill in all number pairs (values 1-8)");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
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
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
      
      {/* Connection Check Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">CONNECTION CHECK MODULE</h3>
        
          
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
      <BombInfoDisplay bomb={bomb} />

      {/* Controls */}
      <SolverControls
        onSolve={solveModule}
        onReset={resetModule}
        isSolveDisabled={pairs.some(p => p.one === 0 || p.two === 0)}
        isLoading={isLoading}
        solveText="Solve"
      />

      {/* Error display */}
      <ErrorAlert error={error} />

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

      {/* Twitch command display */}
      <TwitchCommandDisplay command={twitchCommand} />
      </div>
    </SolverLayout>
  );
}
