import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveForeignExchange, type ForeignExchangeInput, type ForeignExchangeOutput } from "../../services/foreignExchangeService";
import { 
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
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
  } = useSolver();

  const moduleState = useMemo(
    () => ({ baseCurrency, targetCurrency, amount, hasGreenLights, result, twitchCommand }),
    [baseCurrency, targetCurrency, amount, hasGreenLights, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      baseCurrency?: string;
      targetCurrency?: string;
      amount?: string;
      hasGreenLights?: boolean;
      result?: ForeignExchangeOutput | null;
      twitchCommand?: string;
    }) => {
      if (state.baseCurrency !== undefined) setBaseCurrency(state.baseCurrency);
      if (state.targetCurrency !== undefined) setTargetCurrency(state.targetCurrency);
      if (state.amount !== undefined) setAmount(state.amount);
      if (state.hasGreenLights !== undefined) setHasGreenLights(state.hasGreenLights);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: ForeignExchangeOutput) => {
      if (solution?.keyPosition === undefined) return;
      setResult(solution);

      const command = generateTwitchCommand({
        moduleType: ModuleType.FOREIGN_EXCHANGE_RATES,
        result: solution,
      });
      setTwitchCommand(command);
    },
  []);

  useSolverModulePersistence<
    { baseCurrency: string; targetCurrency: string; amount: string; hasGreenLights: boolean; result: ForeignExchangeOutput | null; twitchCommand: string },
    ForeignExchangeOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as ForeignExchangeOutput;
        return raw as ForeignExchangeOutput;
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

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
