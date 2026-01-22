import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveTwoBits, type TwoBitsInput, type TwoBitsOutput } from "../../services/twoBitsService";
import SolverLayout from "../common/SolverLayout";
import BombInfoDisplay from "../common/BombInfoDisplay";
import SolverControls from "../common/SolverControls";
import ErrorAlert from "../common/ErrorAlert";
import TwitchCommandDisplay from "../common/TwitchCommandDisplay";
import { useSolver } from "../../hooks/useSolver";

interface TwoBitsSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function TwoBitsSolver({ bomb }: TwoBitsSolverProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [inputNumber, setInputNumber] = useState("");
  const [result, setResult] = useState<TwoBitsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const { isLoading, error, isSolved, clearError, resetSolverState } = useSolver();

  const solveTwoBitsModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      clearError();
      return;
    }

    clearError();

    try {
      const input: TwoBitsInput = {
        stage: currentStage,
        number: currentStage === 1 ? 0 : parseInt(inputNumber) || 0,
      };

      const response = await solveTwoBits(round.id, bomb.id, currentModule.id, { input });
      
      setResult(response.output);
      const command = generateTwitchCommand({
        moduleType: ModuleType.TWO_BITS,
        result: response.output,
        moduleNumber
      });
      setTwitchCommand(command);

      if (currentStage === 3) {
        markModuleSolved(bomb.id, currentModule.id);
        
        // Save solution to currentModule
        if (currentModule) {
          currentModule.solution = response.output;
        }
      } else {
        setCurrentStage(currentStage + 1);
        setInputNumber("");
      }
    } catch (err) {
      console.error(err instanceof Error ? err.message : "Failed to solve module");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumberChange = (value: string) => {
    const num = parseInt(value);
    if (value === "" || (num >= 0 && num <= 99)) {
      setInputNumber(value);
      clearError();
    }
  };

  const resetModule = () => {
    setCurrentStage(1);
    setInputNumber("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  // Save state to currentModule
  const saveState = () => {
    if (currentModule) {
      currentModule.state = {
        currentStage,
        inputNumber,
        result,
        twitchCommand
      };
    }
  };

  // Restore state from currentModule
  useEffect(() => {
    if (currentModule?.state) {
      const state = currentModule.state as {
        currentStage?: number;
        inputNumber?: string;
        result?: TwoBitsOutput;
        twitchCommand?: string;
      };
      
      if (state.currentStage) setCurrentStage(state.currentStage);
      if (state.inputNumber !== undefined) setInputNumber(state.inputNumber);
      if (state.result) setResult(state.result);
      if (state.twitchCommand) setTwitchCommand(state.twitchCommand);
    }
  }, [currentModule]);

  // Save state whenever it changes
  useEffect(() => {
    saveState();
  }, [currentStage, inputNumber, result, twitchCommand]);

  return (
    <SolverLayout>
      <BombInfoDisplay bomb={bomb} />
      
      {/* Two Bits Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">TWO BITS MODULE</h3>
        
        {/* Stage Display */}
        <div className="bg-black rounded-lg p-6 mb-4">
          <div className="text-center">
            <p className="text-blue-400 text-sm font-medium mb-2">STAGE</p>
            <p className="text-4xl font-bold text-white">{currentStage}/3</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(currentStage / 3) * 100}%` }}
            />
          </div>
        </div>

        {currentStage === 1 ? (
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-300 text-center">
              Stage 1 uses calculated number from bomb properties (serial letter, batteries, ports).
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Enter Number (0-99):
            </label>
            <input
              type="number"
              min="0"
              max="99"
              value={inputNumber}
              onChange={(e) => handleNumberChange(e.target.value)}
              className="input input-bordered w-full max-w-md mx-auto block text-center text-2xl tracking-widest"
              placeholder="00"
              disabled={isLoading || isSolved}
            />
          </div>
        )}
      </div>

      <SolverControls
        onSolve={solveTwoBitsModule}
        onReset={resetModule}
        isSolved={isSolved}
        isLoading={isLoading}
        solveButtonText={currentStage === 1 ? "Calculate Stage 1" : `Solve Stage ${currentStage}`}
        showReset={isSolved}
      />

      <ErrorAlert error={error} />

      {/* Success Message */}
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
          <span>Module Solved!</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-gray-800 rounded-lg p-6 mb-4">
          <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">SOLUTION</h3>
          <div className="bg-black rounded-lg p-6">
            <p className="text-4xl font-mono text-center text-blue-400">
              {result.letters}
            </p>
          </div>
        </div>
      )}

      {twitchCommand && result && (
        <TwitchCommandDisplay command={twitchCommand} />
      )}

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Enter the number displayed on the Two Bits module for each stage.</p>
        <p>• Stage 1 is calculated automatically from bomb properties</p>
        <p>• For stages 2 and 3, enter the number shown on the module</p>
        <p>• The solver will provide the corresponding letter sequence</p>
      </div>
    </SolverLayout>
  );
}
