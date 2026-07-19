import { useCallback, useMemo, useState } from "react";
import { solveWordSearch, type WordSearchOutput } from "../../services/wordSearchService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const CORNER_LABELS = ["Top left", "Top right", "Bottom left", "Bottom right"];

export default function WordSearchSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [corners, setCorners] = useState("");
  const [result, setResult] = useState<WordSearchOutput | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ corners, result, start, end }), [corners, result, start, end]);
  const twitchCommand = /^[A-F][1-6]$/.test(start) && /^[A-F][1-6]$/.test(end)
    ? generateTwitchCommand({ moduleType: ModuleType.WORD_SEARCH, result: { start, end } })
    : "";

  useSolverModulePersistence<typeof moduleState, WordSearchOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.corners !== undefined) setCorners(state.corners);
      if (state.result !== undefined) setResult(state.result);
      if (state.start !== undefined) setStart(state.start);
      if (state.end !== undefined) setEnd(state.end);
    },
    onRestoreSolution: setResult,
    inferSolved: (_solution, module) => Boolean(module && typeof module === "object" && "solved" in module && module.solved),
    currentModule,
    setIsSolved,
  });

  const changeCorners = (value: string) => {
    setCorners(value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4));
    setResult(null); setStart(""); setEnd(""); clearError();
  };

  const changeEndpoint = (which: "start" | "end", value: string) => {
    const coordinate = value.toUpperCase().replace(/[^A-F1-6]/g, "").slice(0, 2);
    const nextStart = which === "start" ? coordinate : start;
    const nextEnd = which === "end" ? coordinate : end;
    if (which === "start") setStart(coordinate); else setEnd(coordinate);
    if (bomb?.id && currentModule?.id && result) {
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { corners, result, start: nextStart, end: nextEnd },
        result,
        isSolved,
      );
    }
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (corners.length !== 4) return setError("Enter all four corner letters");
    clearError(); setIsLoading(true);
    try {
      const response = await solveWordSearch(round.id, bomb.id, currentModule.id, corners);
      setResult(response.output); setStart(""); setEnd(""); setIsSolved(response.solved);
      updateModuleAfterSolve(bomb.id, currentModule.id, { corners, result: response.output, start: "", end: "" }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to get Word Search candidates"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, corners, clearError, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const confirmSolved = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id || !result) return;
    clearError(); setIsLoading(true);
    try {
      const response = await solveWordSearch(round.id, bomb.id, currentModule.id, corners, true);
      setResult(response.output); setIsSolved(true); markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { corners, result: response.output, start, end }, response.output, true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to mark Word Search solved"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, result, corners, start, end, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setCorners(""); setResult(null); setStart(""); setEnd(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Corner letters" description="Enter top-left, top-right, bottom-left, then bottom-right.">
      <div className="mx-auto grid max-w-48 grid-cols-2 gap-2">
        {CORNER_LABELS.map((label, index) => <div key={label} className="rounded border border-border bg-muted/30 p-3 text-center">
          <span className="block whitespace-nowrap text-xs text-muted-foreground">{label}</span>
          <span className="mt-1 block font-mono text-2xl font-bold" aria-label={`${label}: ${corners[index] ?? "empty"}`}>
            {corners[index] ?? "—"}
          </span>
        </div>)}
      </div>
      <Input
        value={corners}
        onChange={(event) => changeCorners(event.target.value)}
        disabled={isLoading || isSolved}
        placeholder="Four corner letters"
        aria-label="Corner letters in reading order"
        className="mt-3 text-center font-mono text-lg tracking-widest"
      />
      <p className="mt-1 text-center text-xs text-muted-foreground">{corners.length}/4 letters</p>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={corners.length !== 4} solveText="Get words" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Possible words" description="Exactly one of these appears in the grid.">
      <ul className="grid grid-cols-2 gap-2">
        {result.words.map((word) => <li key={word} className="rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-center font-mono text-lg font-bold">
          {word}
        </li>)}
      </ul>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[["Start", start], ["End", end]].map(([label, value]) => <label key={label} className="text-sm font-medium">
          {label} coordinate
          <Input
            value={value}
            onChange={(event) => changeEndpoint(label === "Start" ? "start" : "end", event.target.value)}
            placeholder={label === "Start" ? "B3" : "E6"}
            aria-label={`${label} coordinate`}
            className="mt-2 text-center font-mono uppercase"
          />
        </label>)}
      </div>
      <Button type="button" variant="success" className="mt-3 w-full" loading={isLoading} disabled={isSolved} onClick={() => void confirmSolved()}>
        {isSolved ? "Solved" : "Mark solved"}
      </Button>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Find the one listed word in the grid, then select its first and last letters on the module.</SolverInstructions>
  </SolverLayout>;
}
