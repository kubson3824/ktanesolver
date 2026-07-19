import { useCallback, useMemo, useState } from "react";
import { solveBlindAlley, type BlindAlleyOutput } from "../../services/blindAlleyService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { cn } from "../../lib/cn";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const REGIONS = ["TL", "TM", null, "ML", "MC", "MR", "BL", "BM", "BR"];
const LABELS: Record<string, string> = {
  TL: "top left", TM: "top middle", ML: "middle left", MC: "middle center",
  MR: "middle right", BL: "bottom left", BM: "bottom middle", BR: "bottom right",
};

export default function BlindAlleySolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [result, setResult] = useState<BlindAlleyOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ result, twitchCommand }), [result, twitchCommand]);

  const restoreSolution = useCallback((solution: BlindAlleyOutput) => {
    if (!solution?.regions?.length) return;
    setResult(solution);
    setTwitchCommand(solution.regions.join(" "));
  }, []);
  useSolverModulePersistence<typeof moduleState, BlindAlleyOutput>({
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
    clearError(); setIsLoading(true);
    try {
      const response = await solveBlindAlley(round.id, bomb.id, currentModule.id);
      const command = response.output.regions.join(" ");
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Blind Alley"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Invisible regions" description="Uses the bomb's indicators, ports, batteries, holders, and serial number.">
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-2" aria-label="Blind Alley regions">
        {REGIONS.map((region, index) => region ? <div key={region} aria-label={LABELS[region]} className={cn(
          "flex aspect-square items-center justify-center rounded-md border-2 font-mono text-sm",
          result?.regions.includes(region) ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "border-border bg-muted/30 text-muted-foreground",
        )}>
          <span className="text-center"><strong>{region}</strong>{result && <small className="block">{result.conditionCounts[region]}/4</small>}</span>
        </div> : <div key={index} aria-hidden="true" />)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find regions" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press every highlighted region" className="border-emerald-500/40">
      <p className="text-center text-xl font-bold text-emerald-700 dark:text-emerald-400">{result.regions.join(", ")}</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Press the highlighted invisible regions in any order. The missing top-right square is not a region.</SolverInstructions>
  </SolverLayout>;
}
