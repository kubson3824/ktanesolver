import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveConnectionCheck } from "../../services/connectionCheckService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { 
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls,
  SolverResult,
} from "../common";
import { Input } from "../ui/input";

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
  } = useSolver();

  const moduleState = useMemo(
    () => ({ pairs, result, twitchCommand }),
    [pairs, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (restored: { pairs: NumberPair[]; result: boolean[]; twitchCommand: string } | { input?: { pairs?: NumberPair[] } }) => {
      // Handle both formats: with or without input wrapper
      if ('input' in restored && restored.input?.pairs) {
        setPairs(restored.input.pairs);
      } else if ('pairs' in restored && Array.isArray(restored.pairs)) {
        setPairs(restored.pairs);
      }
      
      // These properties only exist in the full state format
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
  []);


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
  };

  const solveModule = async () => {
    clearError();
    setIsLoading(true);

    // Validate all pairs are filled
    const hasInvalidPairs = pairs.some(pair => pair.one === 0 || pair.two === 0);
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
      
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-2 text-sm font-medium">CONNECTION CHECK</h3>
        <p className="text-gray-400 text-center mb-4 text-sm">
          Enter the 4 number pairs from the module (each number 1–8).
        </p>

        <h4 className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-3">Number pairs</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {pairs.map((pair, index) => (
            <div
              key={index}
              className="rounded-lg border border-base-300 bg-base-200/90 p-4 shadow-sm"
            >
              <label className="block text-xs font-medium text-base-content/60 uppercase tracking-wider mb-3">
                Pair {index + 1}
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={pair.one || ""}
                  onChange={(e) => handlePairChange(index, "one", e.target.value)}
                  disabled={isSolved}
                  className="w-14 text-center text-lg font-semibold tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-base-content/40 font-medium select-none" aria-hidden>
                  –
                </span>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={pair.two || ""}
                  onChange={(e) => handlePairChange(index, "two", e.target.value)}
                  disabled={isSolved}
                  className="w-14 text-center text-lg font-semibold tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          ))}
        </div>


      {/* Controls */}
      <SolverControls
        onSolve={solveModule}
        onReset={resetModule}
        isSolveDisabled={pairs.some(p => p.one === 0 || p.two === 0)}
        isLoading={isLoading}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {isSolved && (
        <div className="mb-4">
          <SolverResult variant="success" title="Solution — LED states" />
          <div className="mt-3 grid grid-cols-4 gap-3">
            {result.map((led, index) => (
              <div
                key={index}
                className="text-center bg-gray-900 rounded-lg p-4 border border-gray-700"
              >
                <div className="text-xs font-medium text-gray-400 mb-1">LED {index + 1}</div>
                <div className={`text-xl font-bold ${led ? "text-lime-400" : "text-gray-500"}`}>
                  {led ? "ON" : "OFF"}
                </div>
                <div
                  className={`mt-2 w-full h-2 rounded-full ${led ? "bg-lime-400" : "bg-gray-600"}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <TwitchCommandDisplay command={twitchCommand} />
      </div>
    </SolverLayout>
  );
}
