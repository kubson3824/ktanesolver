import { useCallback, useState } from "react";

import { solvePressX, type PressXOutput } from "../../services/pressXService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

export default function PressXSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [result, setResult] = useState<PressXOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);

  useSolverModulePersistence<{ result: PressXOutput | null; twitchCommand: string }, PressXOutput>({
    state: { result, twitchCommand },
    onRestoreState: (state) => {
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.PRESS_X, result: solution }));
    },
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const response = await solvePressX(round.id, bomb.id, currentModule.id);
      const command = generateTwitchCommand({ moduleType: ModuleType.PRESS_X, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id, { result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Press X");
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
    <SolverSection title="Press X" description="The answer uses the current solved-module count and stored bomb edgework.">
      {result
        ? <div className="space-y-4 text-center">
            <div aria-label={`Press ${result.button}`} className="mx-auto grid h-28 w-28 place-items-center rounded-2xl border-4 border-slate-400 bg-slate-800 text-5xl font-black text-white shadow-lg">
              {result.button}
            </div>
            <p className="font-semibold">{result.timing}</p>
            {!result.anyTime && <div className="flex flex-wrap justify-center gap-2" aria-label="Valid seconds">
              {result.validSeconds.map((second) => <span key={second} className="rounded bg-muted px-2 py-1 font-mono text-sm">{second.toString().padStart(2, "0")}</span>)}
            </div>}
          </div>
        : <p className="py-10 text-center text-sm text-muted-foreground">Solve to calculate the button and timing.</p>}
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={isSolved} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>{result?.instruction ?? "Keep the solved-module count current before solving."}</SolverInstructions>
  </SolverLayout>;
}
