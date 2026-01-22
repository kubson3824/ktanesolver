import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveSwitches, type SwitchesInput, type SwitchesOutput } from "../../services/switchesService";
import SolverLayout from "../common/SolverLayout";
import BombInfoDisplay from "../common/BombInfoDisplay";
import SolverControls from "../common/SolverControls";
import ErrorAlert from "../common/ErrorAlert";
import TwitchCommandDisplay from "../common/TwitchCommandDisplay";
import { useSolver } from "../../hooks/useSolver";

interface SwitchesSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function SwitchesSolver({ bomb }: SwitchesSolverProps) {
  const [currentSwitches, setCurrentSwitches] = useState<boolean[]>([false, false, false, false, false]);
  const [ledPositions, setLedPositions] = useState<boolean[]>([false, false, false, false, false]);
  const [result, setResult] = useState<SwitchesOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const { isLoading, error, isSolved, clearError, resetSolverState } = useSolver();

  const toggleSwitch = (index: number) => {
    if (isLoading || isSolved) return;
    
    const newSwitches = [...currentSwitches];
    newSwitches[index] = !newSwitches[index];
    setCurrentSwitches(newSwitches);
    clearError();
  };

  const toggleLED = (index: number) => {
    if (isLoading || isSolved) return;
    
    const newLEDs = [...ledPositions];
    newLEDs[index] = !newLEDs[index];
    setLedPositions(newLEDs);
    clearError();
  };

  const solveSwitchesModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      clearError();
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const input: SwitchesInput = {
        currentSwitches: currentSwitches,
        ledPositions: ledPositions
      };
      
      const response = await solveSwitches(round.id, bomb.id, currentModule.id, {
        input
      });
      
      setResult(response.output);
      
      if (response.output.solved) {
        markModuleSolved(bomb.id, currentModule.id);
        
        const command = generateTwitchCommand({
          moduleType: ModuleType.SWITCHES,
          result: { instruction: response.output.instruction },
          moduleNumber
        });
        setTwitchCommand(command);
        
        // Save solution to currentModule
        if (currentModule) {
          currentModule.solution = response.output;
        }
      }
    } catch (err) {
      console.error(err instanceof Error ? err.message : "Failed to solve switches module");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setCurrentSwitches([false, false, false, false, false]);
    setLedPositions([false, false, false, false, false]);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  // Save state to currentModule
  const saveState = () => {
    if (currentModule) {
      currentModule.state = {
        currentSwitches,
        ledPositions,
        result,
        twitchCommand
      };
    }
  };

  // Restore state from currentModule
  useEffect(() => {
    if (currentModule?.state) {
      const state = currentModule.state as {
        currentSwitches?: boolean[];
        ledPositions?: boolean[];
        result?: SwitchesOutput;
        twitchCommand?: string;
      };
      
      if (state.currentSwitches) setCurrentSwitches(state.currentSwitches);
      if (state.ledPositions) setLedPositions(state.ledPositions);
      if (state.result) setResult(state.result);
      if (state.twitchCommand) setTwitchCommand(state.twitchCommand);
    }
  }, [currentModule]);

  // Save state whenever it changes
  useEffect(() => {
    saveState();
  }, [currentSwitches, ledPositions, result, twitchCommand]);

  return (
    <SolverLayout>
      <BombInfoDisplay bomb={bomb} />
      
      {/* Switches Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">SWITCHES MODULE</h3>
        
        {/* Switch Display */}
        <div className="bg-black rounded-lg p-6 mb-4">
          <div className="grid grid-cols-5 gap-4">
            {currentSwitches.map((isUp, index) => (
              <div key={index} className="flex flex-col items-center">
                {/* Top LED */}
                <div className={`w-3 h-3 rounded-full mb-2 ${ledPositions[index] ? 'bg-green-500' : 'bg-gray-600'}`} />
                
                {/* Switch */}
                <button
                  onClick={() => toggleSwitch(index)}
                  className={`relative w-12 h-20 rounded-lg border-2 transition-all duration-200 ${
                    isUp 
                      ? 'bg-gray-300 border-gray-400' 
                      : 'bg-gray-600 border-gray-700'
                  } ${isLoading || isSolved ? 'cursor-not-allowed' : 'hover:scale-105'}`}
                  disabled={isLoading || isSolved}
                >
                  <div className={`absolute left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gray-800 rounded transition-all duration-200 ${
                    isUp ? 'top-1' : 'bottom-1'
                  }`} />
                </button>
                
                {/* Bottom LED */}
                <div className={`w-3 h-3 rounded-full mt-2 ${!ledPositions[index] ? 'bg-green-500' : 'bg-gray-600'}`} />
                
                {/* Switch label */}
                <div className="text-xs text-gray-400 mt-2">{index + 1}</div>
              </div>
            ))}
          </div>
        </div>

        {/* LED Position Controls */}
        <div className="mb-4">
          <h4 className="text-sm text-gray-400 mb-2">LED Positions (click to toggle):</h4>
          <div className="grid grid-cols-5 gap-2">
            {ledPositions.map((isTop, index) => (
              <button
                key={index}
                onClick={() => toggleLED(index)}
                className={`btn btn-sm ${
                  isTop ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
                disabled={isLoading || isSolved}
              >
                {index + 1}: {isTop ? '↑' : '↓'}
              </button>
            ))}
          </div>
        </div>

        {/* Current State Display */}
        <div className="text-xs text-gray-500 mb-4 text-center">
          Switches: {currentSwitches.map(s => s ? '↑' : '↓').join(' ')} | 
          LEDs: {ledPositions.map(l => l ? '↑' : '↓').join(' ')}
        </div>
      </div>

      <SolverControls
        onSolve={solveSwitchesModule}
        onReset={reset}
        isSolved={isSolved}
        isLoading={isLoading}
        solveButtonText="Solve"
      />

      <ErrorAlert error={error} />

      {/* Results */}
      {result && (
        <div className={`alert mb-4 ${result.solved ? 'alert-success' : 'alert-info'}`}>
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
              d={result.solved 
                ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              }
            />
          </svg>
          <div className="w-full">
            <span className="font-bold">{result.solved ? "Solved!" : "Solution Path:"}</span>
            <div className="mt-2">{result.instruction}</div>
            {!result.solved && result.solutionSteps.length > 0 && (
              <div className="mt-4">
                <div className="font-semibold mb-2">Step-by-step instructions:</div>
                <div className="space-y-2">
                  {result.solutionSteps.map((switchNum, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="badge badge-primary">{index + 1}</span>
                      <span>Flip Switch {switchNum}</span>
                      {index < result.solutionSteps.length - 1 && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {twitchCommand && result && (
        <TwitchCommandDisplay command={twitchCommand} />
      )}

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Configure the switches and LED positions as shown on the module.</p>
        <p>• Click switches to toggle them up/down</p>
        <p>• Click LED position buttons to set which LED is lit for each switch</p>
        <p>• Green LEDs indicate the lit position</p>
        <p>• The solver will find the shortest path to solve the module</p>
        <p>• Follow the step-by-step instructions to flip switches in order</p>
      </div>
    </SolverLayout>
  );
}
