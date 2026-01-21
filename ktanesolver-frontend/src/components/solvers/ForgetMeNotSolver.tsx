import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveForgetMeNot as solveForgetMeNotApi } from "../../services/forgetMeNotService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { 
  useSolverState,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  BombInfoDisplay,
  SolverControls
} from "../common";

interface ForgetMeNotSolverProps {
  bomb: BombEntity | null | undefined;
}

interface Stage {
  display: number;
  calculated: number;
}

export default function ForgetMeNotSolver({ bomb }: ForgetMeNotSolverProps) {
  const [display, setDisplay] = useState<string>("");
  const [stage, setStage] = useState<number>(1);
  const [stages, setStages] = useState<Stage[]>([]);
  const [sequence, setSequence] = useState<number[]>([]);
  const [showSequence, setShowSequence] = useState<boolean>(false);
  const [allModulesCompleted, setAllModulesCompleted] = useState<boolean>(false);
  const [twitchCommand, setTwitchCommand] = useState<string>("");
  const [reminderShown, setReminderShown] = useState<boolean>(false);

  const { isLoading, error, setIsLoading, setError, clearError, reset: resetSolverState } = useSolverState();
  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  // Show reminder when component mounts
  useEffect(() => {
    if (!reminderShown) {
      setReminderShown(true);
    }
  }, [reminderShown]);

  // Restore state from module when component loads or currentModule changes
  useEffect(() => {
    console.log('ForgetMeNot: currentModule changed', currentModule);
    
    if (currentModule?.state && typeof currentModule.state === 'object') {
      const moduleState = currentModule.state as any;
      console.log('ForgetMeNot: moduleState', moduleState);
      
      // The state might be stored as a ForgetMeNotState object with displayNumbers and calculatedNumbers
      // or it might be stored differently. Let's handle both cases.
      let displayNumbers: number[] = [];
      let calculatedNumbers: number[] = [];
      
      if (moduleState.displayNumbers && moduleState.calculatedNumbers) {
        // Direct properties
        displayNumbers = moduleState.displayNumbers as number[];
        calculatedNumbers = moduleState.calculatedNumbers as number[];
      } else if (Array.isArray(moduleState)) {
        // If state is an array, maybe it's stored differently
        console.log('ForgetMeNot: State is an array', moduleState);
      } else {
        // Try to find numbers in the state object
        console.log('ForgetMeNot: Checking state keys', Object.keys(moduleState));
        
        // The state might be flattened or have different structure
        // Let's check if there are any arrays in the state
        for (const [key, value] of Object.entries(moduleState)) {
          if (Array.isArray(value)) {
            if (key.includes('display') || key.includes('Display')) {
              displayNumbers = value as number[];
            } else if (key.includes('calculated') || key.includes('Calculated')) {
              calculatedNumbers = value as number[];
            }
          }
        }
      }
      
      if (displayNumbers.length > 0 && calculatedNumbers.length > 0) {
        console.log('ForgetMeNot: Restoring state', { displayNumbers, calculatedNumbers });
        
        // Restore stages
        const restoredStages: Stage[] = displayNumbers.map((display, index) => ({
          display,
          calculated: calculatedNumbers[index] || 0
        }));
        setStages(restoredStages);
        
        // Restore sequence
        setSequence(calculatedNumbers);
        
        // Set current stage
        setStage(displayNumbers.length + 1);
        
        // Check if all modules were completed
        if (displayNumbers.length > 0 && displayNumbers[displayNumbers.length - 1] === -1) {
          setAllModulesCompleted(true);
          setShowSequence(true);
          setTwitchCommand(generateTwitchCommand({
            moduleType: ModuleType.FORGET_ME_NOT,
            result: { sequence: calculatedNumbers },
            moduleNumber
          }));
        }
      } else {
        console.log('ForgetMeNot: No valid displayNumbers or calculatedNumbers found');
      }
    } else {
      console.log('ForgetMeNot: No state found on module');
    }
  }, [currentModule, moduleNumber]);

  const handleSolve = async () => {
    const displayValue = parseInt(display);
    
    if (display === "" || isNaN(displayValue) || displayValue < 0 || displayValue > 9) {
      setError("Please enter a valid digit (0-9)");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveForgetMeNotApi(round.id, bomb.id, currentModule.id, {
        input: {
          display: displayValue,
          stage: stage,
          allModulesCompleted: allModulesCompleted
        }
      });

      const newSequence = response.output.sequence;
      const newStage: Stage = {
        display: displayValue,
        calculated: stage === 1 ? newSequence[0] : (stage > 1 ? newSequence[stage - 1] : 0)
      };

      setStages([...stages, newStage]);
      setSequence(newSequence);

      if (allModulesCompleted && displayValue === -1) {
        // All modules completed, show final sequence
        setShowSequence(true);
        setTwitchCommand(generateTwitchCommand({
          moduleType: ModuleType.FORGET_ME_NOT,
          result: { sequence: newSequence },
          moduleNumber
        }));
      } else {
        // Move to next stage
        setStage(stage + 1);
        setDisplay("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Forget Me Not");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisplayChange = (value: string) => {
    // Only allow numbers and limit to 1 digit
    if (value === "" || (/^\d$/.test(value))) {
      setDisplay(value);
      if (error) clearError();
    }
  };

  const handleAllModulesCompleted = async () => {
    setAllModulesCompleted(true);
    setDisplay("-1");
    
    // Automatically trigger the solve with display -1
    await handleFinalSolve();
  };

  const handleFinalSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveForgetMeNotApi(round.id, bomb.id, currentModule.id, {
        input: {
          display: -1,
          stage: stage,
          allModulesCompleted: true
        }
      });

      const newSequence = response.output.sequence;
      setSequence(newSequence);
      setShowSequence(true);
      setTwitchCommand(generateTwitchCommand({
        moduleType: ModuleType.FORGET_ME_NOT,
        result: { sequence: newSequence },
        moduleNumber
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get final sequence");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setDisplay("");
    setStage(1);
    setStages([]);
    setSequence([]);
    setShowSequence(false);
    setAllModulesCompleted(false);
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
      
      {/* Reminder alert */}
      {reminderShown && (
        <div className="alert alert-warning mb-4">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Reminder: Check Forget Me Not!</h3>
            <p className="text-sm">Don't forget to check the Forget Me Not module display and enter the number shown.</p>
          </div>
        </div>
      )}

      {/* Module visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <div className="flex justify-center mb-6">
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="text-center mb-2">
              <span className="text-sm text-gray-400">Stage {stage}</span>
            </div>
            <input
              type="text"
              value={display}
              onChange={(e) => handleDisplayChange(e.target.value)}
              placeholder="0"
              className="text-6xl font-mono font-bold text-green-400 bg-transparent text-center w-full outline-none"
              maxLength={1}
              disabled={isLoading || showSequence}
            />
          </div>
        </div>

        {/* Stage history */}
        {stages.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Stage History:</h4>
            <div className="space-y-1">
              {stages.map((s, index) => (
                <div key={index} className="flex justify-center gap-4 text-sm">
                  <span className="text-gray-400">Stage {index + 1}:</span>
                  <span className="text-green-400">Display: {s.display}</span>
                  <span className="text-blue-400">Calculated: {s.calculated}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final sequence */}
        {showSequence && sequence.length > 0 && (
          <div className="mt-6 p-4 bg-green-900/30 rounded-lg border border-green-500">
            <h4 className="text-lg font-bold text-green-400 mb-2 text-center">Final Sequence</h4>
            <div className="flex justify-center gap-1">
              {sequence.map((num, index) => (
                <div
                  key={index}
                  className="w-10 h-10 bg-green-500 rounded flex items-center justify-center text-white font-bold text-lg"
                >
                  {num}
                </div>
              ))}
            </div>
            <p className="text-sm text-green-300 mt-2 text-center">Press the numbers in this order!</p>
          </div>
        )}
      </div>

      {/* Serial number and batteries display */}
      <BombInfoDisplay 
        bomb={bomb} 
        showBatteries={true}
        showIndicators={true}
      />

      {/* Controls */}
      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!display || showSequence}
        isLoading={isLoading}
        solveText={allModulesCompleted ? "Get Sequence" : "Calculate Stage"}
        loadingText={allModulesCompleted ? "Getting Sequence..." : "Calculating..."}
      />

      {/* All modules completed button */}
      {!allModulesCompleted && stages.length > 0 && (
        <div className="mb-4">
          <button
            onClick={handleAllModulesCompleted}
            className="btn btn-secondary w-full"
            disabled={isLoading}
          >
            {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
            {isLoading ? "Getting Sequence..." : "All Modules Solved"}
          </button>
        </div>
      )}

      {/* Error */}
      <ErrorAlert error={error} />

      {/* Twitch Command */}
      <TwitchCommandDisplay command={twitchCommand} />

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p>Enter the digit shown on the Forget Me Not module display. Click "All Modules Solved" when all other modules are solved to get the final sequence.</p>
      </div>
    </SolverLayout>
  );
}
