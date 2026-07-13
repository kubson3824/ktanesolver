import { useCallback, useMemo, useState } from "react";
import { solveBitmaps, type BitmapsOutput } from "../../services/bitmapsService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { cn } from "../../lib/cn";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";

const EMPTY_COUNTS = [0, 0, 0, 0];
const QUADRANTS = ["Top left", "Top right", "Bottom left", "Bottom right"];

export default function BitmapsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [whiteCounts, setWhiteCounts] = useState(EMPTY_COUNTS);
  const [uniformLineCoordinate, setUniformLineCoordinate] = useState(0);
  const [squareCenterX, setSquareCenterX] = useState(0);
  const [result, setResult] = useState<BitmapsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ whiteCounts, uniformLineCoordinate, squareCenterX, result, twitchCommand }),
    [whiteCounts, uniformLineCoordinate, squareCenterX, result, twitchCommand],
  );

  useSolverModulePersistence<typeof moduleState, BitmapsOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.whiteCounts?.length === 4) setWhiteCounts(state.whiteCounts);
      if (state.uniformLineCoordinate !== undefined) setUniformLineCoordinate(state.uniformLineCoordinate);
      if (state.squareCenterX !== undefined) setSquareCenterX(state.squareCenterX);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      if (!solution?.button) return;
      setResult(solution);
      setTwitchCommand(`press ${solution.button}`);
    },
    currentModule,
    setIsSolved,
  });

  const changeCount = (index: number, count: number) => {
    setWhiteCounts((current) => current.map((value, i) => i === index ? count : value));
    setResult(null);
    setTwitchCommand("");
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { whiteCounts, uniformLineCoordinate, squareCenterX };
      const response = await solveBitmaps(round.id, bomb.id, currentModule.id, input);
      const command = `press ${response.output.button}`;
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved,
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Bitmaps"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, whiteCounts, uniformLineCoordinate, squareCenterX, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setWhiteCounts(EMPTY_COUNTS); setUniformLineCoordinate(0); setSquareCenterX(0);
    setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Quadrant counts" description="Enter the white tiles in each 4×4 quadrant; black is calculated automatically.">
      <div className="grid grid-cols-2 gap-3">
        {whiteCounts.map((white, index) => <label key={QUADRANTS[index]} className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <span className="mb-2 block font-medium">{QUADRANTS[index]}</span>
          <Input
            type="number"
            min={0}
            max={16}
            value={white}
            disabled={isLoading || isSolved}
            onChange={(event) => changeCount(index, Math.max(0, Math.min(16, event.target.valueAsNumber || 0)))}
            aria-label={`${QUADRANTS[index]} white tiles`}
          />
          <span className="mt-2 block text-muted-foreground">White {white} · Black {16 - white}</span>
        </label>)}
      </div>
    </SolverSection>
    <SolverSection title="Layout exceptions" description="These two manual rules cannot be determined from quadrant totals.">
      <label className="block text-sm font-medium">
        Exactly one solid row or column
        <select value={uniformLineCoordinate} onChange={(event) => setUniformLineCoordinate(Number(event.target.value))} disabled={isLoading || isSolved} className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value={0}>No</option>
          {Array.from({ length: 8 }, (_, i) => <option key={i + 1} value={i + 1}>Yes — coordinate {i + 1}</option>)}
        </select>
      </label>
      <label className="mt-3 block text-sm font-medium">
        First solid 3×3 square in reading order
        <select value={squareCenterX} onChange={(event) => setSquareCenterX(Number(event.target.value))} disabled={isLoading || isSolved} className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value={0}>None</option>
          {Array.from({ length: 6 }, (_, i) => <option key={i + 2} value={i + 2}>Center x-coordinate {i + 2}</option>)}
        </select>
      </label>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find button" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press this button" className="border-emerald-500/40">
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((button) => <div key={button} className={cn(
          "flex aspect-square items-center justify-center rounded-lg border-2 text-2xl font-bold",
          result.button === button ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "border-border text-muted-foreground",
        )}>{button}</div>)}
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">Rule {result.rule}; answer {result.answer}</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Quadrants are top-left, top-right, bottom-left, then bottom-right. Each contains 16 tiles.</SolverInstructions>
  </SolverLayout>;
}
