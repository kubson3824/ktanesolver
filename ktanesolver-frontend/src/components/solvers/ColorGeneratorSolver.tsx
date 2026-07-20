import { useCallback, useMemo, useState } from "react";
import { solveColorGenerator, type ColorGeneratorOutput } from "../../services/colorGeneratorService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

export default function ColorGeneratorSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [result, setResult] = useState<ColorGeneratorOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ result }), [result]);

  useSolverModulePersistence<typeof moduleState, ColorGeneratorOutput>({
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
      const response = await solveColorGenerator(round.id, bomb.id, currentModule.id);
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { result: response.output }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Color Generator"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => { setResult(null); resetSolverState(); }, [resetSolverState]);
  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.COLOR_GENERATOR, result }) : "";

  return <SolverLayout>
    <SolverSection title="Bomb serial number" description="Letters become A=1 through Z=26, then every character is reduced modulo 16.">
      <p className="text-center font-mono text-2xl font-bold tracking-[0.3em]">{bomb?.serialNumber || "—"}</p>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Generate color" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Submit this color" className="border-emerald-500/40">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <dl className="grid grid-cols-3 gap-3 text-center">
          {(["red", "green", "blue"] as const).map((color) => <div key={color} className="rounded-md border p-3">
            <dt className="capitalize text-muted-foreground">{color}</dt><dd className="font-mono text-2xl font-bold">{result[color]}</dd>
          </div>)}
        </dl>
        <div className="mx-auto h-20 w-20 rounded-md border shadow-inner" style={{ backgroundColor: `rgb(${result.red}, ${result.green}, ${result.blue})` }} aria-label={`RGB preview: ${result.red}, ${result.green}, ${result.blue}`} />
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Reset the module, enter the red, green, and blue values with the colored buttons and multiplier, then press SUBMIT.</SolverInstructions>
  </SolverLayout>;
}
