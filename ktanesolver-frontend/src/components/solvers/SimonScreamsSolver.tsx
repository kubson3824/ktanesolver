import { useCallback, useMemo, useState } from "react";
import { Undo2 } from "lucide-react";

import { solveSimonScreams, type SimonScreamsColor, type SimonScreamsOutput } from "../../services/simonScreamsService";
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

const COLORS: { color: SimonScreamsColor; label: string; button: string; chip: string }[] = [
  { color: "RED", label: "Red", button: "bg-red-600 hover:bg-red-500", chip: "border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-300" },
  { color: "ORANGE", label: "Orange", button: "bg-orange-500 hover:bg-orange-400", chip: "border-orange-500/50 bg-orange-500/15 text-orange-700 dark:text-orange-300" },
  { color: "YELLOW", label: "Yellow", button: "bg-yellow-500 hover:bg-yellow-400 text-black", chip: "border-yellow-500/50 bg-yellow-500/15 text-yellow-700 dark:text-yellow-300" },
  { color: "GREEN", label: "Green", button: "bg-green-600 hover:bg-green-500", chip: "border-green-500/50 bg-green-500/15 text-green-700 dark:text-green-300" },
  { color: "BLUE", label: "Blue", button: "bg-blue-600 hover:bg-blue-500", chip: "border-blue-500/50 bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  { color: "PURPLE", label: "Purple", button: "bg-purple-600 hover:bg-purple-500", chip: "border-purple-500/50 bg-purple-500/15 text-purple-700 dark:text-purple-300" },
];
const MAX_LENGTH = [5, 7, 9];

interface StageResult extends SimonScreamsOutput {
  flashes: SimonScreamsColor[];
}

function colorSpec(color: SimonScreamsColor) {
  return COLORS.find((entry) => entry.color === color)!;
}

function ColorChip({ color, index }: { color: SimonScreamsColor; index?: number }) {
  const spec = colorSpec(color);
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold", spec.chip)}>
      {index !== undefined && <span className="opacity-60">{index + 1}.</span>}
      {spec.label}
    </span>
  );
}

export default function SimonScreamsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [clockwiseColors, setClockwiseColors] = useState<SimonScreamsColor[]>([]);
  const [stage, setStage] = useState(1);
  const [flashes, setFlashes] = useState<SimonScreamsColor[]>([]);
  const [history, setHistory] = useState<StageResult[]>([]);
  const [result, setResult] = useState<SimonScreamsOutput | null>(null);
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);
  const {
    currentModule, round, isLoading, isSolved, error,
    setIsLoading, setIsSolved, setError, clearError, reset: resetSolverState, markModuleSolved,
  } = useSolver();

  const moduleState = useMemo(
    () => ({ clockwiseColors, stage, flashes, history, result, twitchCommands }),
    [clockwiseColors, stage, flashes, history, result, twitchCommands],
  );

  const restoreState = useCallback((raw: unknown) => {
    const state = raw as Record<string, unknown>;
    if (Array.isArray(state.flashHistory)) {
      if (Array.isArray(state.clockwiseColors)) setClockwiseColors(state.clockwiseColors as SimonScreamsColor[]);
      const flashHistory = state.flashHistory as SimonScreamsColor[][];
      const ruleHistory = Array.isArray(state.ruleHistory) ? state.ruleHistory as string[] : [];
      const pressHistory = Array.isArray(state.pressHistory) ? state.pressHistory as SimonScreamsColor[][] : [];
      const restored = flashHistory.map((entry, index) => ({
        stage: index + 1,
        flashes: entry,
        rule: ruleHistory[index] ?? "",
        press: pressHistory[index] ?? [],
      }));
      setHistory(restored);
      setStage(Math.min(flashHistory.length + 1, 3));
      setFlashes(flashHistory.length && flashHistory.length < 3 ? flashHistory.at(-1)! : []);
      setTwitchCommands(restored.map((entry) => generateTwitchCommand({ moduleType: ModuleType.SIMON_SCREAMS, result: entry })));
      return;
    }
    if (Array.isArray(state.clockwiseColors)) setClockwiseColors(state.clockwiseColors as SimonScreamsColor[]);
    if (typeof state.stage === "number") setStage(state.stage);
    if (Array.isArray(state.flashes)) setFlashes(state.flashes as SimonScreamsColor[]);
    if (Array.isArray(state.history)) setHistory(state.history as StageResult[]);
    if (state.result && typeof state.result === "object") setResult(state.result as SimonScreamsOutput);
    if (Array.isArray(state.twitchCommands)) setTwitchCommands(state.twitchCommands as string[]);
  }, []);

  useSolverModulePersistence<typeof moduleState, SimonScreamsOutput>({
    state: moduleState,
    onRestoreState: restoreState,
    onRestoreSolution: setResult,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as Partial<SimonScreamsOutput>;
      return typeof value.stage === "number" && Array.isArray(value.press) && typeof value.rule === "string"
        ? value as SimonScreamsOutput : null;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const previousLength = history.at(-1)?.flashes.length ?? 0;

  const addFlash = (color: SimonScreamsColor) => {
    if (isLoading || isSolved || flashes.length >= MAX_LENGTH[stage - 1]) return;
    setFlashes((current) => [...current, color]);
    setResult(null);
    clearError();
  };

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    setIsLoading(true);
    clearError();
    try {
      const response = await solveSimonScreams(round.id, bomb.id, currentModule.id, stage, clockwiseColors, flashes);
      const entry = { ...response.output, flashes: [...flashes] };
      const command = generateTwitchCommand({ moduleType: ModuleType.SIMON_SCREAMS, result: response.output });
      setHistory((current) => [...current, entry]);
      setTwitchCommands((current) => [...current, command]);
      setResult(response.output);
      if (response.solved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
      } else {
        setStage((current) => current + 1);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Simon Screams");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setClockwiseColors([]); setStage(1); setFlashes([]); setHistory([]); setResult(null); setTwitchCommands([]); resetSolverState();
  };

  return (
    <SolverLayout>
      <SolverSection title="Clockwise color layout" description="Click all six lights in clockwise order, starting anywhere. This is locked after stage 1.">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {COLORS.map((entry) => (
            <button
              key={entry.color}
              type="button"
              onClick={() => setClockwiseColors((current) => [...current, entry.color])}
              disabled={isLoading || history.length > 0 || clockwiseColors.includes(entry.color)}
              aria-label={`Add ${entry.label} to clockwise layout`}
              className={cn("rounded-md border px-2 py-2 text-xs font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40", entry.button)}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-border bg-muted/20 p-2" aria-live="polite">
          {clockwiseColors.length ? clockwiseColors.map((color, index) => <ColorChip key={color} color={color} index={index} />) : <span className="text-sm text-muted-foreground">No layout entered.</span>}
        </div>
        {history.length === 0 && (
          <div className="mt-2 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setClockwiseColors((current) => current.slice(0, -1))} disabled={isLoading || clockwiseColors.length === 0}>
              <Undo2 className="mr-1 h-4 w-4" /> Undo layout
            </Button>
          </div>
        )}
      </SolverSection>

      <SolverSection title="Stage progress" description={isSolved ? "All 3 stages complete." : `Stage ${stage} of 3`}>
        <StageIndicator total={3} current={isSolved ? 4 : stage} completedThrough={isSolved ? 3 : stage - 1} />
      </SolverSection>

      {!isSolved && (
        <SolverSection title={`Stage ${stage} flashing sequence`} description="Enter every flash in order, including repeats. The previous stage is kept as the prefix.">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {COLORS.map((entry) => (
              <button
                key={entry.color}
                type="button"
                onClick={() => addFlash(entry.color)}
                disabled={isLoading || flashes.length >= MAX_LENGTH[stage - 1]}
                aria-label={`Add ${entry.label} flash`}
                className={cn("aspect-square rounded-full border-2 border-black/10 text-xs font-bold text-white shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50", entry.button)}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-border bg-muted/20 p-2" aria-live="polite">
            {flashes.length ? flashes.map((color, index) => <ColorChip key={`${index}-${color}`} color={color} index={index} />) : <span className="text-sm text-muted-foreground">No flashes entered.</span>}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setFlashes((current) => current.slice(0, -1))} disabled={isLoading || flashes.length <= previousLength}>
              <Undo2 className="mr-1 h-4 w-4" /> Undo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setFlashes(history.at(-1)?.flashes ?? [])} disabled={isLoading || flashes.length <= previousLength}>
              Clear new flashes
            </Button>
          </div>
        </SolverSection>
      )}

      {result && (
        <>
          <SolverResult title={`Stage ${result.stage}: press in this order`} description={result.press.map((color) => colorSpec(color).label).join(" → ")} />
          <div className="flex flex-wrap gap-1.5" aria-label="Required press sequence">
            {result.press.map((color, index) => <ColorChip key={`${index}-${color}`} color={color} index={index} />)}
          </div>
        </>
      )}

      <SolverControls
        onSolve={solve}
        onReset={reset}
        isSolveDisabled={clockwiseColors.length !== 6 || flashes.length < stage + 2}
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
                <div className="font-semibold">Stage {entry.stage}: {entry.press.map((color) => colorSpec(color).label).join(" → ")}</div>
                <div className="mt-1 text-xs text-muted-foreground">Rule: {entry.rule}</div>
              </li>
            ))}
          </ul>
        </SolverSection>
      )}

      {twitchCommands.length > 0 && <TwitchCommandDisplay command={twitchCommands} />}
      <SolverInstructions>
        Record the complete growing sequence each stage. Press the returned colors from left to right before recording the next replay.
      </SolverInstructions>
    </SolverLayout>
  );
}
