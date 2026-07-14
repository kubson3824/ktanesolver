import { useCallback, useMemo, useState } from "react";

import { cn } from "../../lib/cn";
import { solveNeutralization, type NeutralizationOutput } from "../../services/neutralizationService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverResult, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const COLORS = [
  { value: "YELLOW", label: "Yellow", className: "bg-yellow-400" },
  { value: "GREEN", label: "Green", className: "bg-green-600" },
  { value: "RED", label: "Red", className: "bg-red-600" },
  { value: "BLUE", label: "Blue", className: "bg-blue-600" },
];
const VOLUMES = [5, 10, 15, 20];

const twitchCommands = (result: NeutralizationOutput) => [
  `!number base ${result.baseFormula}`,
  `!number conc set ${result.drops}`,
  ...(result.filterOn ? ["!number filter"] : []),
  "!number titrate",
];

export default function NeutralizationSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [acidColor, setAcidColor] = useState("");
  const [acidVolume, setAcidVolume] = useState(0);
  const [result, setResult] = useState<NeutralizationOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ acidColor, acidVolume, result }), [acidColor, acidVolume, result]);

  useSolverModulePersistence<typeof moduleState, NeutralizationOutput>({
    state: moduleState,
    onRestoreState: useCallback((state) => {
      if (state.acidColor) setAcidColor(state.acidColor);
      if (state.acidVolume) setAcidVolume(state.acidVolume);
      if (state.result !== undefined) setResult(state.result);
    }, []),
    onRestoreSolution: useCallback((solution: NeutralizationOutput) => setResult(solution), []),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!acidColor || !acidVolume) return setError("Select the acid color and volume");
    clearError(); setIsLoading(true);
    try {
      const input = { acidColor, acidVolume };
      const response = await solveNeutralization(round.id, bomb.id, currentModule.id, input);
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Neutralization"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, acidColor, acidVolume, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setAcidColor(""); setAcidVolume(0); setResult(null); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Acid color" description="Select the color of the liquid in the tube.">
      <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <legend className="sr-only">Acid color</legend>
        {COLORS.map((color) => <label key={color.value} className={cn(
          "cursor-pointer rounded-lg border p-3 text-center text-sm font-medium",
          acidColor === color.value && "border-primary bg-primary/5",
        )}>
          <input className="sr-only" type="radio" name="acidColor" value={color.value} checked={acidColor === color.value} onChange={() => { setAcidColor(color.value); clearError(); }} disabled={isLoading || isSolved} />
          <span className={cn("mx-auto mb-2 block h-10 w-10 rounded-full border border-black/30", color.className)} aria-hidden />
          {color.label}
        </label>)}
      </fieldset>
    </SolverSection>
    <SolverSection title="Acid volume" description="Read the liquid level shown beside the tube.">
      <fieldset className="grid grid-cols-4 gap-2">
        <legend className="sr-only">Acid volume</legend>
        {VOLUMES.map((volume) => <label key={volume} className={cn(
          "cursor-pointer rounded-lg border p-3 text-center font-mono font-semibold",
          acidVolume === volume && "border-primary bg-primary/5",
        )}>
          <input className="sr-only" type="radio" name="acidVolume" value={volume} checked={acidVolume === volume} onChange={() => { setAcidVolume(volume); clearError(); }} disabled={isLoading || isSolved} />
          {volume} mL
        </label>)}
      </fieldset>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!acidColor || !acidVolume} isLoading={isLoading} isSolved={isSolved} solveText="Calculate titration" />
    <ErrorAlert error={error} />
    {result && <SolverResult
      title={`${result.baseFormula} · ${result.drops} drops · filter ${result.filterOn ? "ON" : "OFF"}`}
      description={`Base: ${result.baseName}\nAcid: ${result.acidFormula} at ${result.acidConcentration}\nBase concentration: ${result.baseConcentration}`}
    />}
    {result && <TwitchCommandDisplay command={twitchCommands(result)} />}
    <SolverInstructions>Set the base formula, enter the drop count, set the filter state, then press TITRATE.</SolverInstructions>
  </SolverLayout>;
}
