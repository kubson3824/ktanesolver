import { useCallback, useMemo, useState } from "react";
import { solveLightCycle, type LightCycleInput, type LightCycleOutput } from "../../services/lightCycleService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";
import { cn } from "../../lib/cn";

const COLORS = ["RED", "YELLOW", "GREEN", "BLUE", "MAGENTA", "WHITE"] as const;
const LED_CLASSES: Record<string, string> = {
  RED: "bg-red-500",
  YELLOW: "bg-yellow-400",
  GREEN: "bg-green-500",
  BLUE: "bg-blue-500",
  MAGENTA: "bg-fuchsia-500",
  WHITE: "bg-white",
};

interface LightCycleSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function LightCycleSolver({ bomb }: LightCycleSolverProps) {
  const [initialColors, setInitialColors] = useState<string[]>([...COLORS]);
  const [result, setResult] = useState<LightCycleOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ initialColors, result, twitchCommand }),
    [initialColors, result, twitchCommand],
  );

  const onRestoreState = useCallback((state: Partial<typeof moduleState> & { input?: Partial<LightCycleInput> }) => {
    const input = state.input ?? state;
    if (input.initialColors) setInitialColors(input.initialColors);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: LightCycleOutput) => {
    if (!solution?.sequence) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.LIGHT_CYCLE, result: solution }));
  }, []);

  useSolverModulePersistence<typeof moduleState, LightCycleOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as LightCycleOutput & { output?: LightCycleOutput };
      return value.output ?? value;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const changeColor = (index: number, color: string) => {
    setInitialColors((current) => current.map((value, position) => position === index ? color : value));
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (new Set(initialColors).size !== COLORS.length) return setError("Use each color exactly once");
    clearError();
    setIsLoading(true);
    try {
      const input = { initialColors };
      const response = await solveLightCycle(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.LIGHT_CYCLE, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Light Cycle");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, initialColors, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setInitialColors([...COLORS]);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  const validPermutation = new Set(initialColors).size === COLORS.length;

  return (
    <SolverLayout>
      <SolverSection title="LED order" description="Set the six LEDs from left to right.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {initialColors.map((color, index) => (
            <label key={index} className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
              <span className={cn("h-5 w-5 shrink-0 rounded-full border border-black/40 shadow-sm", LED_CLASSES[color])} aria-hidden />
              <span className="sr-only">LED {index + 1}</span>
              <select
                value={color}
                onChange={(event) => changeColor(index, event.target.value)}
                disabled={isLoading || isSolved}
                aria-label={`LED ${index + 1} color`}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
              >
                {COLORS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          ))}
        </div>
      </SolverSection>

      <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!validPermutation} isLoading={isLoading} isSolved={isSolved} solveText="Get sequence" />
      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Press when lit" className="border-emerald-500/40">
          <ol className="flex flex-wrap justify-center gap-2">
            {result.sequence.map((color, index) => (
              <li key={index} className="flex items-center gap-2 rounded-full border px-3 py-2 font-medium" aria-label={`${index + 1}: ${color}`}>
                <span className={cn("h-5 w-5 rounded-full border border-black/40", LED_CLASSES[color])} aria-hidden />
                {color}
              </li>
            ))}
          </ol>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>Press the module button as each listed LED lights. The bomb serial number is read from the current bomb.</SolverInstructions>
    </SolverLayout>
  );
}
