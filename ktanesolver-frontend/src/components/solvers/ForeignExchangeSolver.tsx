import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveForeignExchange, type ForeignExchangeInput, type ForeignExchangeOutput } from "../../services/foreignExchangeService";
import { 
  useSolver,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  BombInfoDisplay,
  SolverControls
} from "../common";

interface ForeignExchangeSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function ForeignExchangeSolver({ bomb }: ForeignExchangeSolverProps) {
  const [baseCurrency, setBaseCurrency] = useState<string>("");
  const [targetCurrency, setTargetCurrency] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [hasGreenLights, setHasGreenLights] = useState<boolean>(true);
  const [result, setResult] = useState<ForeignExchangeOutput | null>(null);
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

  // Restore state from module when component loads
  useEffect(() => {
    if (currentModule?.state && typeof currentModule.state === 'object') {
      const moduleState = currentModule.state as { 
        baseCurrency?: string;
        targetCurrency?: string;
        amount?: string;
        hasGreenLights?: boolean;
      };
      
      if (moduleState.baseCurrency !== undefined) setBaseCurrency(moduleState.baseCurrency);
      if (moduleState.targetCurrency !== undefined) setTargetCurrency(moduleState.targetCurrency);
      if (moduleState.amount !== undefined) setAmount(moduleState.amount);
      if (moduleState.hasGreenLights !== undefined) setHasGreenLights(moduleState.hasGreenLights);
    }

    // Restore solution if module was solved
    if (currentModule?.solution && typeof currentModule.solution === 'object') {
      const solution = currentModule.solution as ForeignExchangeOutput;
      
      if (solution.keyPosition !== undefined) {
        setResult(solution);
        setIsSolved(true);

        // Generate twitch command from the solution
        const command = generateTwitchCommand({
          moduleType: ModuleType.FOREIGN_EXCHANGE_RATES,
          result: solution,
          moduleNumber
        });
        setTwitchCommand(command);
      }
    }
  }, [currentModule, moduleNumber, setIsSolved]);

  // Save state when inputs change
  const saveState = () => {
    if (currentModule) {
      const moduleState = { baseCurrency, targetCurrency, amount, hasGreenLights };
      // Update the module in the store
      const { round } = useRoundStore.getState();
      round?.bombs.forEach(bomb => {
        if (bomb.id === currentModule.bomb.id) {
          const module = bomb.modules.find(m => m.id === currentModule.id);
          if (module) {
            module.state = moduleState;
          }
        }
      });
    }
  };

  const solveForeignExchangeModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    if (!baseCurrency || !targetCurrency || !amount) {
      setError("Please fill in all fields");
      return;
    }

    if (baseCurrency.length !== 3 || targetCurrency.length !== 3) {
      setError("Currency codes must be exactly 3 letters");
      return;
    }

    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum < 0) {
      setError("Please enter a valid 3-digit amount");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const input: ForeignExchangeInput = {
        baseCurrency: baseCurrency.toUpperCase(),
        targetCurrency: targetCurrency.toUpperCase(),
        amount,
        hasGreenLights
      };

      const response = await solveForeignExchange(
        round.id,
        bomb.id,
        currentModule.id,
        { input }
      );

      setResult(response.output);
      setIsSolved(true);
      
      // Generate Twitch command
      const command = generateTwitchCommand({
        moduleType: ModuleType.FOREIGN_EXCHANGE_RATES,
        result: response.output,
        moduleNumber
      });
      setTwitchCommand(command);
      
      markModuleSolved(bomb.id, currentModule.id);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to solve module");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setBaseCurrency("");
    setTargetCurrency("");
    setAmount("");
    setHasGreenLights(true);
    setResult(null);
    setTwitchCommand("");
    saveState();
    resetSolverState();
  };

  return (
    <SolverLayout>
      {/* Module visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">MODULE VIEW</h3>
        
        {!isSolved ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">LED Status</label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={hasGreenLights}
                    onChange={() => {
                      setHasGreenLights(true);
                      saveState();
                    }}
                    className="mr-2"
                  />
                  <span className="text-green-400">Green Lights (API Available)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={!hasGreenLights}
                    onChange={() => {
                      setHasGreenLights(false);
                      saveState();
                    }}
                    className="mr-2"
                  />
                  <span className="text-red-400">Red Lights (API Failed)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Base Currency (3-letter code)</label>
                <input
                  type="text"
                  value={baseCurrency}
                  onChange={(e) => {
                    setBaseCurrency(e.target.value.toUpperCase());
                    saveState();
                  }}
                  placeholder="e.g., USD"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-400 focus:border-primary focus:outline-none"
                  disabled={isLoading}
                  maxLength={3}
                  style={{ textTransform: "uppercase" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Currency (3-letter code)</label>
                <input
                  type="text"
                  value={targetCurrency}
                  onChange={(e) => {
                    setTargetCurrency(e.target.value.toUpperCase());
                    saveState();
                  }}
                  placeholder="e.g., EUR"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-400 focus:border-primary focus:outline-none"
                  disabled={isLoading}
                  maxLength={3}
                  style={{ textTransform: "uppercase" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amount (3-digit number)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  saveState();
                }}
                placeholder="Enter 3-digit amount..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-400 focus:border-primary focus:outline-none"
                disabled={isLoading}
                min="0"
                max="999"
              />
            </div>

            <button
              onClick={solveForeignExchangeModule}
              disabled={isLoading || !baseCurrency || !targetCurrency || !amount}
              className="w-full btn btn-primary"
            >
              {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
              {isLoading ? "Solving..." : "Solve"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-900/50 border border-green-600 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2 text-green-300">Solution</h3>
              <p className="text-lg text-gray-100">
                Press key <span className="font-bold text-xl text-green-300">
                  {result?.keyPosition === 0 ? "1 (top-left)" : result?.keyPosition}
                </span>
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Count keys from left to right, top to bottom
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bomb info display */}
      <BombInfoDisplay bomb={bomb} />

      {/* Controls */}
      <SolverControls
        onSolve={solveForeignExchangeModule}
        onReset={reset}
        isSolveDisabled={!baseCurrency || !targetCurrency || !amount}
        isLoading={isLoading}
        solveText="Solve"
      />

      {/* Error display */}
      <ErrorAlert error={error} />

      {/* Twitch command display */}
      <TwitchCommandDisplay command={twitchCommand} />
    </SolverLayout>
  );
}
