import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveKnob } from "../../services/knobsService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { 
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls
} from "../common";

interface KnobsSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function KnobsSolver({ bomb }: KnobsSolverProps) {
  const [indicators, setIndicators] = useState<boolean[]>(Array(12).fill(false));
  const [result, setResult] = useState<string>("");
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
    () => ({ indicators, result, twitchCommand }),
    [indicators, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: { indicators?: boolean[]; result?: string; twitchCommand?: string }) => {
      if (state.indicators && Array.isArray(state.indicators)) {
        setIndicators(state.indicators);
      }
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: { position: string }) => {
      if (!solution?.position) return;
      const display = solution.position === "Unknown configuration" ? solution.position : `Turn knob ${solution.position}`;
      setResult(display);

      const command = generateTwitchCommand({
        moduleType: ModuleType.KNOBS,
        result: { position: solution.position },
      });
      setTwitchCommand(command);
    },
  []);

  useSolverModulePersistence<
    { indicators: boolean[]; result: string; twitchCommand: string },
    { position: string }
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; position?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as { position: string };
        if (typeof anyRaw.position === "string") return { position: anyRaw.position };
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleIndicatorChange = (index: number, checked: boolean) => {
    const newIndicators = [...indicators];
    newIndicators[index] = checked;
    setIndicators(newIndicators);
    setResult("");
  };

  const handleSolve = async () => {
    if (isSolved) return;

    clearError();
    setIsLoading(true);

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      setIsLoading(false);
      return;
    }

    try {
      const response = await solveKnob(round.id, bomb.id, currentModule.id, { indicators });
      const position = response.position;
      setResult(position === "Unknown configuration" ? position : `Turn knob ${position}`);
      setIsSolved(true);

      // Generate Twitch command
      const command = generateTwitchCommand({
        moduleType: ModuleType.KNOBS,
        result: { position },
      });
      setTwitchCommand(command);

      markModuleSolved(bomb.id, currentModule.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve module");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIndicators(Array(12).fill(false));
    setResult("");
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
      {/* Module visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Select the indicators that are lit on the module, then click solve to determine the correct knob position.
          </p>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {indicators.map((checked, index) => (
            <div key={index} className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => handleIndicatorChange(index, e.target.checked)}
                className="checkbox checkbox-primary"
                id={`indicator-${index}`}
                disabled={isSolved}
              />
              <label htmlFor={`indicator-${index}`} className="ml-2 text-sm">
                {index + 1}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <SolverControls
        onSolve={handleSolve}
        onReset={handleReset}
        isSolveDisabled={!indicators.some(i => i)}
        isLoading={isLoading}
        solveText="Solve"
      />

      {/* Error display */}
      <ErrorAlert error={error} />

      {/* Result */}
      {result && (
        <div className={`p-4 rounded-lg text-center font-bold text-lg ${
          result.includes("Unknown")
            ? "bg-gray-100 text-gray-800"
            : "alert alert-success"
        }`}>
          {result}
        </div>
      )}

      {/* Twitch command display */}
      <TwitchCommandDisplay command={twitchCommand} />
    </SolverLayout>
  );
}
