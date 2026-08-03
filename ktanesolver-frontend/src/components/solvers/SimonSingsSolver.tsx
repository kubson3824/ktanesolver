import { useCallback, useMemo, useState } from "react";
import { Undo2 } from "lucide-react";

import { solveSimonSings, type SimonSingsOutput } from "../../services/simonSingsService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { cn } from "../../lib/cn";
import { Button } from "../ui/button";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverResult,
  SolverSection,
  StageIndicator,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";

const NOTES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"] as const;
const SHARPS = new Set(["C♯", "D♯", "F♯", "G♯", "A♯"]);

interface StageResult extends SimonSingsOutput {
  flashes: string[];
}

export default function SimonSingsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState(1);
  const [flashes, setFlashes] = useState<string[]>([]);
  const [history, setHistory] = useState<StageResult[]>([]);
  const [result, setResult] = useState<SimonSingsOutput | null>(null);
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);
  const {
    currentModule, round, isLoading, isSolved, error,
    setIsLoading, setIsSolved, setError, clearError, reset: resetSolverState, markModuleSolved,
  } = useSolver();

  const moduleState = useMemo(
    () => ({ stage, flashes, history, result, twitchCommands }),
    [stage, flashes, history, result, twitchCommands],
  );

  const restoreState = useCallback((raw: unknown) => {
    const state = raw as Record<string, unknown>;
    if (Array.isArray(state.flashHistory)) {
      const flashHistory = state.flashHistory as string[][];
      const pressHistory = Array.isArray(state.pressHistory) ? state.pressHistory as string[][] : [];
      const restored = flashHistory.map((entry, index) => ({
        stage: index + 1,
        flashes: entry,
        press: pressHistory[index] ?? [],
      }));
      setHistory(restored);
      setStage(Math.min(flashHistory.length + 1, 3));
      setFlashes([]);
      setResult(restored.at(-1) ?? null);
      setTwitchCommands(restored.map((entry) => generateTwitchCommand({ moduleType: ModuleType.SIMON_SINGS, result: entry })));
      return;
    }
    if (typeof state.stage === "number") setStage(state.stage);
    if (Array.isArray(state.flashes)) setFlashes(state.flashes as string[]);
    if (Array.isArray(state.history)) setHistory(state.history as StageResult[]);
    if (state.result && typeof state.result === "object") setResult(state.result as SimonSingsOutput);
    if (Array.isArray(state.twitchCommands)) setTwitchCommands(state.twitchCommands as string[]);
  }, []);

  useSolverModulePersistence<typeof moduleState, SimonSingsOutput>({
    state: moduleState,
    onRestoreState: restoreState,
    onRestoreSolution: setResult,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as Partial<SimonSingsOutput>;
      return typeof value.stage === "number" && Array.isArray(value.press) ? value as SimonSingsOutput : null;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const addFlash = (note: string) => {
    if (isLoading || isSolved || flashes.length >= 8 || flashes.includes(note)) return;
    setFlashes((current) => [...current, note]);
    setResult(null);
    clearError();
  };

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    setIsLoading(true);
    clearError();
    try {
      const response = await solveSimonSings(round.id, bomb.id, currentModule.id, flashes);
      const entry = { ...response.output, flashes: [...flashes] };
      setHistory((current) => [...current, entry]);
      setTwitchCommands((current) => [...current, generateTwitchCommand({ moduleType: ModuleType.SIMON_SINGS, result: response.output })]);
      setResult(response.output);
      setFlashes([]);
      if (response.solved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
      } else {
        setStage((current) => current + 1);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Simon Sings");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStage(1); setFlashes([]); setHistory([]); setResult(null); setTwitchCommands([]); resetSolverState();
  };

  return (
    <SolverLayout>
      <SolverSection title="Stage progress" description={isSolved ? "All 3 stages complete." : `Stage ${stage} of 3`}>
        <StageIndicator total={3} current={isSolved ? 4 : stage} completedThrough={isSolved ? 3 : stage - 1} />
      </SolverSection>

      {!isSolved && (
        <SolverSection title={`Stage ${stage} flashing sequence`} description="Select the eight key colors in flashing order. Each note appears at most once per stage.">
          <div className="grid grid-cols-6 gap-2" role="group" aria-label="Piano notes">
            {NOTES.map((note) => (
              <button
                key={note}
                type="button"
                onClick={() => addFlash(note)}
                disabled={isLoading || flashes.includes(note) || flashes.length >= 8}
                aria-label={`Add ${note} flash`}
                className={cn(
                  "min-h-14 rounded-md border px-2 text-sm font-bold shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-35",
                  SHARPS.has(note) ? "border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800" : "bg-white text-zinc-900 hover:bg-zinc-100",
                )}
              >
                {note}
              </button>
            ))}
          </div>
          <div className="mt-3 flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-border bg-muted/20 p-2" aria-live="polite">
            {flashes.length ? flashes.map((note, index) => (
              <span key={note} className="rounded-md border bg-background px-2 py-1 text-xs font-semibold">
                <span className="mr-1 text-muted-foreground">{index + 1}.</span>{note}
              </span>
            )) : <span className="text-sm text-muted-foreground">No flashes entered.</span>}
          </div>
          <div className="mt-2 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setFlashes((current) => current.slice(0, -1))} disabled={isLoading || flashes.length === 0}>
              <Undo2 className="mr-1 h-4 w-4" /> Undo
            </Button>
          </div>
        </SolverSection>
      )}

      {result && <SolverResult title={`Stage ${result.stage}: play in this order`} description={result.press.join(" → ")} />}

      <SolverControls
        onSolve={solve}
        onReset={reset}
        isSolveDisabled={flashes.length !== 8}
        isResetDisabled={history.length > 0}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText={`Solve stage ${stage}`}
        loadingText="Solving…"
      />
      <ErrorAlert error={error} />

      {history.length > 0 && (
        <SolverSection title="Stage history">
          <ul className="space-y-2">
            {history.map((entry) => (
              <li key={entry.stage} className="rounded-md border border-border bg-muted/20 p-3 text-sm">
                <div className="font-semibold">Stage {entry.stage}: {entry.press.join(" → ")}</div>
                <div className="mt-1 text-xs text-muted-foreground">Flashes: {entry.flashes.join(" · ")}</div>
              </li>
            ))}
          </ul>
        </SolverSection>
      )}

      {twitchCommands.length > 0 && <TwitchCommandDisplay command={twitchCommands} />}
      <SolverInstructions>
        Enter the eight colors shown by the center light for each stage. Play the full returned sequence; later stages include every earlier pair.
      </SolverInstructions>
    </SolverLayout>
  );
}
