import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveConnectionCheck } from "../../services/connectionCheckService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls,
  SolverResult,
} from "../common";
import { Input } from "../ui/input";
import { cn } from "../../lib/cn";

interface NumberPair {
  one: number;
  two: number;
}

interface ConnectionCheckSolverProps {
  bomb: BombEntity | null | undefined;
}

const EMPTY_PAIRS: NumberPair[] = [
  { one: 0, two: 0 },
  { one: 0, two: 0 },
  { one: 0, two: 0 },
  { one: 0, two: 0 },
];

export default function ConnectionCheckSolver({ bomb }: ConnectionCheckSolverProps) {
  const [pairs, setPairs] = useState<NumberPair[]>(EMPTY_PAIRS);
  const [result, setResult] = useState<boolean[]>([false, false, false, false]);
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
    () => ({ pairs, result, twitchCommand }),
    [pairs, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (
      restored:
        | { pairs: NumberPair[]; result: boolean[]; twitchCommand: string }
        | { input?: { pairs?: NumberPair[] } },
    ) => {
      if ('input' in restored && restored.input?.pairs) {
        setPairs(restored.input.pairs);
      } else if ('pairs' in restored && Array.isArray(restored.pairs)) {
        setPairs(restored.pairs);
      }

      if ('result' in restored && Array.isArray(restored.result)) {
        setResult(restored.result);
      }
      if ('twitchCommand' in restored && restored.twitchCommand) {
        setTwitchCommand(restored.twitchCommand);
      }
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: { led1?: boolean; led2?: boolean; led3?: boolean; led4?: boolean }) => {
      if (!solution) return;
      const ledStates = [
        solution.led1 ?? false,
        solution.led2 ?? false,
        solution.led3 ?? false,
        solution.led4 ?? false,
      ];
      setResult(ledStates);

      const command = generateTwitchCommand({
        moduleType: ModuleType.CONNECTION_CHECK,
        result: { ledStates: ledStates },
      });
      setTwitchCommand(command);
    },
    [],
  );

  useSolverModulePersistence<
    { pairs: NumberPair[]; result: boolean[]; twitchCommand: string } | { input?: { pairs?: NumberPair[] } },
    { led1?: boolean; led2?: boolean; led3?: boolean; led4?: boolean }
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        if ('led1' in raw || 'led2' in raw || 'led3' in raw || 'led4' in raw) {
          return raw as { led1?: boolean; led2?: boolean; led3?: boolean; led4?: boolean };
        }
        const anyRaw = raw as { output?: unknown; ledStates?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object") {
          const output = anyRaw.output as { ledStates?: boolean[] };
          if (Array.isArray(output.ledStates)) {
            return {
              led1: output.ledStates[0],
              led2: output.ledStates[1],
              led3: output.ledStates[2],
              led4: output.ledStates[3],
            };
          }
        }
        if (Array.isArray(anyRaw.ledStates)) {
          return {
            led1: anyRaw.ledStates[0],
            led2: anyRaw.ledStates[1],
            led3: anyRaw.ledStates[2],
            led4: anyRaw.ledStates[3],
          };
        }
      }
      return null;
    },
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handlePairChange = (index: number, field: 'one' | 'two', value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(1, Math.min(8, numValue));

    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [field]: clampedValue };
    setPairs(newPairs);
    clearError();
  };

  const solveModule = async () => {
    clearError();
    setIsLoading(true);

    const hasInvalidPairs = pairs.some((pair) => pair.one === 0 || pair.two === 0);
    if (hasInvalidPairs) {
      setError("Please fill in all number pairs (values 1-8)");
      setIsLoading(false);
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    try {
      const response = await solveConnectionCheck(round.id, bomb.id, currentModule.id, {
        input: { pairs },
      });

      const ledStates = [
        response.output.led1,
        response.output.led2,
        response.output.led3,
        response.output.led4,
      ];

      setResult(ledStates);
      setIsSolved(true);

      const command = generateTwitchCommand({
        moduleType: ModuleType.CONNECTION_CHECK,
        result: { ledStates: ledStates },
      });
      setTwitchCommand(command);

      markModuleSolved(bomb.id, currentModule.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to solve module");
    } finally {
      setIsLoading(false);
    }
  };

  const resetModule = () => {
    setPairs(EMPTY_PAIRS);
    setResult([false, false, false, false]);
    setTwitchCommand("");
    resetSolverState();
  };

  const isInvalid = pairs.some((p) => p.one === 0 || p.two === 0);

  return (
    <SolverLayout>
      <SolverSection
        title="Number pairs"
        description="Enter the 4 number pairs shown on the module (each digit 1–8)."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pairs.map((pair, index) => (
            <div
              key={index}
              className="rounded-lg border border-border bg-muted/40 p-3"
            >
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pair {index + 1}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={pair.one || ""}
                  onChange={(e) => handlePairChange(index, "one", e.target.value)}
                  disabled={isSolved || isLoading}
                  aria-label={`Pair ${index + 1} first digit`}
                  className="w-14 text-center text-lg font-semibold tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-muted-foreground font-medium select-none" aria-hidden>
                  –
                </span>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={pair.two || ""}
                  onChange={(e) => handlePairChange(index, "two", e.target.value)}
                  disabled={isSolved || isLoading}
                  aria-label={`Pair ${index + 1} second digit`}
                  className="w-14 text-center text-lg font-semibold tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          ))}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={solveModule}
        onReset={resetModule}
        isSolveDisabled={isInvalid}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {isSolved && (
        <>
          <SolverResult variant="success" title="LED states" />
          <div className="grid grid-cols-4 gap-2">
            {result.map((led, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-lg border p-3 text-center transition-colors",
                  led
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-border bg-muted/40",
                )}
              >
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  LED {index + 1}
                </div>
                <div
                  className={cn(
                    "mt-1 text-base font-bold",
                    led ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
                  )}
                >
                  {led ? "ON" : "OFF"}
                </div>
                <div
                  aria-hidden
                  className={cn(
                    "mx-auto mt-2 h-1.5 w-full rounded-full",
                    led ? "bg-emerald-500" : "bg-muted-foreground/30",
                  )}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Enter the four 1–8 number pairs from the module; the solver returns which LEDs should be
        lit.
      </SolverInstructions>
    </SolverLayout>
  );
}
