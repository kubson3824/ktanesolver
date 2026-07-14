import { useCallback, useMemo, useState } from "react";
import { solveRhythms, type RhythmsInput, type RhythmsOutput } from "../../services/rhythmsService";
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

const PATTERNS = [
  ["1", "⅓", "⅓", "⅓", "1", "⅓", "⅓", "⅓"],
  ["2", "1", "½", "½"],
  ["½", "1", "½", "1", "1"],
  ["1½", "½", "1", "⅓", "⅓", "⅓"],
  ["½", "½", "1", "2"],
  ["1", "2", "⅓", "⅓", "⅓"],
  ["1", "1", "1", "1"],
] as const;
const COLORS = [
  { name: "BLUE", className: "bg-blue-500" },
  { name: "RED", className: "bg-red-500" },
  { name: "GREEN", className: "bg-green-500" },
  { name: "YELLOW", className: "bg-yellow-400" },
] as const;

interface RhythmsSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function RhythmsSolver({ bomb }: RhythmsSolverProps) {
  const [rhythm, setRhythm] = useState<number | null>(null);
  const [color, setColor] = useState("");
  const [result, setResult] = useState<RhythmsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ rhythm, color, result, twitchCommand }),
    [rhythm, color, result, twitchCommand],
  );

  const onRestoreState = useCallback((state: Partial<typeof moduleState> & { input?: Partial<RhythmsInput> }) => {
    const input = state.input ?? state;
    if (typeof input.rhythm === "number") setRhythm(input.rhythm);
    if (input.color) setColor(input.color);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: RhythmsOutput) => {
    if (!solution) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.RHYTHMS, result: solution }));
  }, []);

  useSolverModulePersistence<typeof moduleState, RhythmsOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as RhythmsOutput & { output?: RhythmsOutput };
      return value.output ?? value;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (rhythm === null || !color) return setError("Select the rhythm and light color");
    clearError();
    setIsLoading(true);
    try {
      const input = { rhythm, color };
      const response = await solveRhythms(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.RHYTHMS, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Rhythms");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, rhythm, color, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setRhythm(null);
    setColor("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return (
    <SolverLayout>
      <SolverSection title="Flash rhythm" description="Choose the matching spacing between flashes; values are beats.">
        <div className="grid gap-2 sm:grid-cols-2">
          {PATTERNS.map((beats, index) => (
            <label key={index} className={cn("flex cursor-pointer items-center gap-3 rounded-md border p-3", rhythm === index && "border-primary bg-primary/5")}>
              <input type="radio" name="rhythm" checked={rhythm === index} onChange={() => { setRhythm(index); clearError(); }} disabled={isLoading || isSolved} />
              <span className="font-medium">{index + 1}</span>
              <span className="flex flex-wrap gap-1 font-mono text-sm" aria-label={`Pattern ${index + 1}: ${beats.join(", ")} beats`}>
                {beats.map((beat, beatIndex) => <span key={beatIndex} className="rounded bg-muted px-1.5 py-0.5">{beat}</span>)}
              </span>
            </label>
          ))}
        </div>
      </SolverSection>

      <SolverSection title="Indicator color">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {COLORS.map((option) => (
            <label key={option.name} className={cn("flex cursor-pointer items-center gap-2 rounded-md border p-3", color === option.name && "border-primary bg-primary/5")}>
              <input type="radio" name="color" checked={color === option.name} onChange={() => { setColor(option.name); clearError(); }} disabled={isLoading || isSolved} />
              <span className={cn("h-5 w-5 rounded-full border border-black/40", option.className)} aria-hidden />
              <span className="text-sm font-medium">{option.name}</span>
            </label>
          ))}
        </div>
      </SolverSection>

      <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={rhythm === null || !color} isLoading={isLoading} isSolved={isSolved} solveText="Get actions" />
      <ErrorAlert error={error} />

      {result?.mash && (
        <SolverSection title="Mash buttons" className="border-emerald-500/40">
          <p className="text-center font-semibold text-emerald-700 dark:text-emerald-300">Press buttons as quickly as possible until the module disarms.</p>
        </SolverSection>
      )}
      {result && !result.mash && (
        <SolverSection title="Perform in order" className="border-emerald-500/40">
          <ol className="grid gap-3 sm:grid-cols-2">
            {result.actions.map((action, index) => (
              <li key={index} className="rounded-md border bg-emerald-500/10 p-4 text-center">
                <div className="text-4xl" aria-label={`Button ${action.button}`}>{action.button}</div>
                <div className="mt-1 font-medium">{action.beeps === 0 ? "Press and release immediately" : `Release after ${action.beeps} beep${action.beeps === 1 ? "" : "s"}`}</div>
              </li>
            ))}
          </ol>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>The current bomb supplies battery and lit-indicator adjustments automatically. A strike produces a new rhythm and color, so reset this solver before entering the replacement pattern.</SolverInstructions>
    </SolverLayout>
  );
}
