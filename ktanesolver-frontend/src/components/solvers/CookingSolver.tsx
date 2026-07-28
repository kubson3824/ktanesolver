import { useCallback, useMemo, useState } from "react";
import { solveCooking, type CookingOutput } from "../../services/cookingService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const SETTING_LABELS: Record<CookingOutput["ovenSetting"], string> = {
  BOTTOM_ELEMENT_HEAT: "Bottom Element Heat",
  BOTTOM_ELEMENT_HEAT_WITH_GRILL: "Bottom Element Heat with Grill",
  CONVENTIONAL_HEATING: "Conventional Heating",
  FAN_OVEN: "Fan Oven",
  GRILL: "Grill",
  FAN_WITH_GRILL: "Fan with Grill",
};

export default function CookingSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [result, setResult] = useState<CookingOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ result }), [result]);

  useSolverModulePersistence<typeof moduleState, CookingOutput>({
    state: moduleState,
    onRestoreState: (state) => { if (state.result !== undefined) setResult(state.result); },
    onRestoreSolution: (solution) => { if (solution) setResult(solution); },
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveCooking(round.id, bomb.id, currentModule.id);
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { result: response.output }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Cooking"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => { setResult(null); resetSolverState(); }, [resetSolverState]);
  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.COOKING, result }) : "";

  return <SolverLayout>
    <SolverSection title="Cooking" description="Fully automatic — uses batteries, indicators, serial number, and port plates from the bomb setup.">
      <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate settings" />
    </SolverSection>
    <ErrorAlert error={error} />
    {result && <SolverSection title="Set the oven" className="border-emerald-500/40">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4"><dt className="text-sm text-muted-foreground">Meal</dt><dd className="text-lg font-bold">{result.meal}</dd></div>
        <div className="rounded-lg border p-4"><dt className="text-sm text-muted-foreground">Temperature</dt><dd className="text-lg font-bold">{result.temperatureC}°C</dd></div>
        <div className="rounded-lg border p-4"><dt className="text-sm text-muted-foreground">Oven setting</dt><dd className="text-lg font-bold">{SETTING_LABELS[result.ovenSetting]}</dd></div>
        <div className="rounded-lg border p-4"><dt className="text-sm text-muted-foreground">Lamp</dt><dd className="text-lg font-bold">{result.lightOn ? "On" : "Off"}</dd></div>
        <div className="rounded-lg border p-4"><dt className="text-sm text-muted-foreground">Cook for</dt><dd className="text-lg font-bold">{result.person}</dd></div>
        <div className="rounded-lg border p-4"><dt className="text-sm text-muted-foreground">Time</dt><dd className="text-lg font-bold">{result.timeMinutes} minutes</dd></div>
      </dl>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Set the temperature on the left display, time on the right display, oven mode, and lamp state, then press Cook.</SolverInstructions>
  </SolverLayout>;
}
