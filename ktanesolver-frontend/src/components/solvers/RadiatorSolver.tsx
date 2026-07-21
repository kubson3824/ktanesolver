import { useCallback, useMemo, useState } from "react";
import { solveRadiator, type RadiatorOutput } from "../../services/radiatorService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

export default function RadiatorSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [result, setResult] = useState<RadiatorOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ result, twitchCommand }), [result, twitchCommand]);

  const restoreSolution = useCallback((solution: RadiatorOutput) => {
    if (!Number.isInteger(solution?.temperature) || !Number.isInteger(solution?.water)) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.RADIATOR, result: solution }));
  }, []);

  useSolverModulePersistence<typeof moduleState, RadiatorOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: restoreSolution,
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveRadiator(round.id, bomb.id, currentModule.id);
      const command = generateTwitchCommand({ moduleType: ModuleType.RADIATOR, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id, { result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Radiator");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Radiator" description="Uses the bomb's serial number, batteries, ports, and indicators.">
      <div className="mx-auto grid max-w-md grid-cols-2 gap-4" aria-label="Radiator submission values">
        <Value label="Temperature first" value={result?.temperature} color="text-red-600 dark:text-red-400" />
        <Value label="Water second" value={result?.water} color="text-cyan-600 dark:text-cyan-400" />
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate values" />
    <ErrorAlert error={error} />
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Enter the temperature and submit it, then enter the water value and submit it.</SolverInstructions>
  </SolverLayout>;
}

function Value({ label, value, color }: { label: string; value?: number; color: string }) {
  return <div className="rounded-lg border border-border bg-muted/40 p-4 text-center">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={`mt-2 font-mono text-4xl font-bold tabular-nums ${color}`}>{value ?? "--"}</div>
  </div>;
}
