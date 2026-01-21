import { useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveForeignExchange, type ForeignExchangeInput, type ForeignExchangeOutput } from "../../services/foreignExchangeService";
import ModuleNumberInput from "../ModuleNumberInput";

interface ForeignExchangeSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function ForeignExchangeSolver({ bomb }: ForeignExchangeSolverProps) {
  const [baseCurrency, setBaseCurrency] = useState<string>("");
  const [targetCurrency, setTargetCurrency] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [hasGreenLights, setHasGreenLights] = useState<boolean>(true);
  const [result, setResult] = useState<ForeignExchangeOutput | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

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
    setError("");

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
    setIsSolved(false);
    setError("");
    setTwitchCommand("");
  };

  return (
    <div className="w-full">
      <ModuleNumberInput />
      
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
                    onChange={() => setHasGreenLights(true)}
                    className="mr-2"
                  />
                  <span className="text-green-400">Green Lights (API Available)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={!hasGreenLights}
                    onChange={() => setHasGreenLights(false)}
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
                  onChange={(e) => setBaseCurrency(e.target.value.toUpperCase())}
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
                  onChange={(e) => setTargetCurrency(e.target.value.toUpperCase())}
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
                onChange={(e) => setAmount(e.target.value)}
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

      {/* Serial number display */}
      <div className="bg-base-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-base-content/70">
          Serial Number: <span className="font-mono font-bold">{bomb?.serialNumber || "Unknown"}</span>
        </p>
      </div>

      {/* Controls for solved state */}
      {isSolved && (
        <div className="flex gap-3 mb-4">
          <button
            onClick={reset}
            className="btn btn-outline"
          >
            Reset
          </button>
        </div>
      )}

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
  );
}
