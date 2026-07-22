import { useCallback, useMemo, useState } from "react";

import { solveTheSwan, type TheSwanOutput } from "../../services/theSwanService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";

export default function TheSwanSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [resetCount, setResetCount] = useState(0);
  const [result, setResult] = useState<TheSwanOutput | null>(null);
  const [buttonPositions, setButtonPositions] = useState<number[]>([]);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ resetCount, result, buttonPositions }), [resetCount, result, buttonPositions]);

  useSolverModulePersistence<typeof moduleState, TheSwanOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (typeof state.resetCount === "number") setResetCount(state.resetCount);
      if (state.result) setResult(state.result);
      if (Array.isArray(state.buttonPositions)) setButtonPositions(state.buttonPositions);
    },
    onRestoreSolution: (solution) => { setResult(solution); setResetCount(solution.resetCount); },
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!Number.isInteger(resetCount) || resetCount < 0) return setError("Enter a reset count of zero or greater");
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveTheSwan(round.id, bomb.id, currentModule.id, { resetCount });
      setResult(response.output); setButtonPositions(Array(response.output.code.length).fill(0)); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { resetCount, result: response.output, buttonPositions: [] }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Swan"); }
    finally { setIsLoading(false); }
  }, [resetCount, round?.id, bomb?.id, currentModule?.id, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setResetCount(0); setResult(null); setButtonPositions([]); resetSolverState();
  }, [resetSolverState]);
  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.THE_SWAN, result: { ...result, buttonPositions } }) : "";

  return <SolverLayout>
    <SolverSection title="System resets" description="Count only successful entries of 4, 8, 15, 16, 23, 42 followed by Execute.">
      <label className="space-y-1.5 text-sm font-medium">Reset count<Input type="number" min={0} value={Number.isNaN(resetCount) ? "" : resetCount} onChange={(event) => setResetCount(event.currentTarget.valueAsNumber)} disabled={isLoading || isSolved} /></label>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Disarm code" description={`After ${result.resetCount} successful reset${result.resetCount === 1 ? "" : "s"}, enter:`} className="border-emerald-500/40">
      <div className="rounded-md border-2 border-emerald-500 bg-emerald-500/15 p-5 text-center font-mono text-5xl font-black tracking-[0.25em] text-emerald-700 dark:text-emerald-300">{result.code}</div>
      <fieldset className="mt-4"><legend className="text-sm font-medium">Twitch button positions (reading order)</legend><p className="mt-1 text-sm text-muted-foreground">Select the position of each displayed character to generate a safe command.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-6">{result.code.split("").map((character, index) => <label key={index} className="text-center text-sm font-semibold">{character}<select aria-label={`${character} button position ${index + 1}`} value={buttonPositions[index] || ""} onChange={(event) => setButtonPositions((positions) => positions.map((position, i) => i === index ? Number(event.target.value) : position))} className="mt-1 block h-9 w-full rounded-md border border-input bg-background px-2"><option value="">—</option>{Array.from({ length: 12 }, (_, position) => <option key={position + 1} value={position + 1}>{position + 1}</option>)}</select></label>)}</div>
      </fieldset>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>A timeout or the automatic three-minute timer reset does not count. At 25 or more resets, the code is always 77.</SolverInstructions>
  </SolverLayout>;
}
