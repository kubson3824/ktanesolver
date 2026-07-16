import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  solveForeignExchange,
  type ForeignExchangeInput,
  type ForeignExchangeOutput,
} from "../../services/foreignExchangeService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  SegmentedControl,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverResult,
} from "../common";
import { Input } from "../ui/input";

interface ForeignExchangeSolverProps {
  bomb: BombEntity | null | undefined;
}

const LED_OPTIONS = [
  { value: "green" as const, label: "Green" },
  { value: "red" as const, label: "Red" },
] as const;

export default function ForeignExchangeSolver({ bomb }: ForeignExchangeSolverProps) {
  const [baseCurrency, setBaseCurrency] = useState<string>("");
  const [targetCurrency, setTargetCurrency] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [hasGreenLights, setHasGreenLights] = useState<boolean>(true);
  const [result, setResult] = useState<ForeignExchangeOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

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

  const onRestoreSolution = useCallback((solution: ForeignExchangeOutput) => {
    if (solution?.keyPosition === undefined) return;
    setResult(solution);

    const command = generateTwitchCommand({
      moduleType: ModuleType.FOREIGN_EXCHANGE_RATES,
      result: solution,
    });
    setTwitchCommand(command);
  }, []);

  useSolverModulePersistence<
    {
      baseCurrency: string;
      targetCurrency: string;
      amount: string;
      hasGreenLights: boolean;
      result: ForeignExchangeOutput | null;
      twitchCommand: string;
    },
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

    if (![baseCurrency, targetCurrency].every((code) => /^([A-Z]{3}|\d{3})$/.test(code))) {
      setError("Currency codes must be exactly 3 letters or 3 digits");
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
        hasGreenLights,
      };

      const response = await solveForeignExchange(round.id, bomb.id, currentModule.id, { input });

      if (!response.solved) {
        throw new Error("Could not calculate the exchange rate. Check the currency codes and try again.");
      }

      setResult(response.output);
      setIsSolved(true);

      const command = generateTwitchCommand({
        moduleType: ModuleType.FOREIGN_EXCHANGE_RATES,
        result: response.output,
      });
      setTwitchCommand(command);

      markModuleSolved(bomb.id, currentModule.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to solve module");
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

  const keyLabel =
    result?.keyPosition === 0
      ? "Key 1 (top-left)"
      : result != null
        ? `Key ${result.keyPosition}`
        : "";

  return (
    <SolverLayout>
      <SolverSection
        title="Module state"
        description="Enter the two currency rows as displayed; the solver handles the battery-based swap."
        actions={
          <SegmentedControl
            value={hasGreenLights ? "green" : "red"}
            onChange={(v) => setHasGreenLights(v === "green")}
            options={LED_OPTIONS}
            size="sm"
            ariaLabel="LED color"
            disabled={isLoading || isSolved}
          />
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Top row currency code
            </span>
            <Input
              type="text"
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value.toUpperCase())}
              placeholder="USD or 840"
              maxLength={3}
              disabled={isLoading || isSolved}
              className="font-mono uppercase"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Middle row currency code
            </span>
            <Input
              type="text"
              value={targetCurrency}
              onChange={(e) => setTargetCurrency(e.target.value.toUpperCase())}
              placeholder="EUR or 978"
              maxLength={3}
              disabled={isLoading || isSolved}
              className="font-mono uppercase"
            />
          </label>
        </div>

        <label className="mt-3 block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Amount (3 digits)
          </span>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="000"
            min={0}
            max={999}
            disabled={isLoading || isSolved}
            className="font-mono"
          />
        </label>
      </SolverSection>

      <SolverControls
        onSolve={solveForeignExchangeModule}
        onReset={reset}
        isSolveDisabled={!baseCurrency || !targetCurrency || !amount}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result && (
        <SolverResult
          variant="success"
          title="Press this key"
          description={`Position: ${keyLabel}\nCount keys left-to-right, top-to-bottom.`}
        />
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Each currency may appear as a 3-letter or 3-digit ISO code. Green LEDs use the
        live exchange rate; red LEDs use the target currency&apos;s numeric code.
      </SolverInstructions>
    </SolverLayout>
  );
}
