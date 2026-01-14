remove import { useState } from "react";
import type { BombEntity } from "../types";
import { ModuleType } from "../types";
import { useRoundStore } from "../store/useRoundStore";
import { generateTwitchCommand } from "../utils/twitchCommands";
import { solveForeignExchange, type ForeignExchangeInput, type ForeignExchangeOutput } from "../services/foreignExchangeService";

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
      const keyPosition = response.output.keyPosition;
      const command = generateTwitchCommand(
        moduleNumber,
        `Press key ${keyPosition === 0 ? "1 (top-left)" : keyPosition}`
      );
      setTwitchCommand(command);
      
      markModuleSolved(currentModule.id);
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
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Foreign Exchange Rates Solver</h2>
      
      {!isSolved ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">LED Status</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={hasGreenLights}
                  onChange={() => setHasGreenLights(true)}
                  className="mr-2"
                />
                <span className="text-green-600">Green Lights (API Available)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!hasGreenLights}
                  onChange={() => setHasGreenLights(false)}
                  className="mr-2"
                />
                <span className="text-red-600">Red Lights (API Failed)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Base Currency (3-letter code)</label>
              <input
                type="text"
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value.toUpperCase())}
                placeholder="e.g., USD"
                className="w-full p-2 border rounded"
                disabled={isLoading}
                maxLength={3}
                style={{ textTransform: "uppercase" }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Target Currency (3-letter code)</label>
              <input
                type="text"
                value={targetCurrency}
                onChange={(e) => setTargetCurrency(e.target.value.toUpperCase())}
                placeholder="e.g., EUR"
                className="w-full p-2 border rounded"
                disabled={isLoading}
                maxLength={3}
                style={{ textTransform: "uppercase" }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount (3-digit number)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter 3-digit amount..."
              className="w-full p-2 border rounded"
              disabled={isLoading}
              min="0"
              max="999"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            onClick={solveForeignExchangeModule}
            disabled={isLoading || !baseCurrency || !targetCurrency || !amount}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {isLoading ? "Solving..." : "Solve"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-100 p-4 rounded">
            <h3 className="font-bold text-lg mb-2">Solution</h3>
            <p className="text-lg">
              Press key <span className="font-bold text-xl">
                {result?.keyPosition === 0 ? "1 (top-left)" : result?.keyPosition}
              </span>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Count keys from left to right, top to bottom
            </p>
          </div>

          {twitchCommand && (
            <div className="bg-gray-100 p-3 rounded">
              <h4 className="font-medium mb-1">Twitch Command</h4>
              <code className="text-sm">{twitchCommand}</code>
            </div>
          )}

          <button
            onClick={reset}
            className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
