import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import {
  solveSimonShrieks,
  type SimonShrieksColor,
} from "../../services/simonShrieksService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
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

const POSITIONS = [
  "At the arrow",
  "1 clockwise",
  "2 clockwise",
  "3 clockwise",
  "4 clockwise",
  "5 clockwise",
  "6 clockwise",
] as const;

type StageResult = {
  stage: number;
  flashes: number[];
  presses: SimonShrieksColor[];
};

export default function SimonShrieksSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState(1);
  const [flashes, setFlashes] = useState<number[]>([]);
  const [history, setHistory] = useState<StageResult[]>([]);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();

  const expectedFlashes = stage * 2 + 2;
  const moduleState = useMemo(() => ({ stage, flashes, history }), [stage, flashes, history]);

  const onRestoreState = useCallback((state: unknown) => {
    const saved = state as Record<string, unknown>;
    if (Array.isArray(saved.pressHistory) && Array.isArray(saved.flashes)) {
      const savedFlashes = saved.flashes as number[];
      const restored = (saved.pressHistory as SimonShrieksColor[][]).map((presses, index) => ({
        stage: index + 1,
        flashes: savedFlashes.slice(0, (index + 1) * 2 + 2),
        presses,
      }));
      setFlashes(savedFlashes);
      setHistory(restored);
      setStage(Math.min(restored.length + 1, 3));
      return;
    }
    if (typeof saved.stage === "number") setStage(saved.stage);
    if (Array.isArray(saved.flashes)) setFlashes(saved.flashes as number[]);
    if (Array.isArray(saved.history)) setHistory(saved.history as StageResult[]);
  }, []);

  useSolverModulePersistence<
    { stage: number; flashes: number[]; history: StageResult[] },
    { presses: SimonShrieksColor[] } | null
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution: () => undefined,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const addFlash = (position: number) => {
    if (flashes.length >= expectedFlashes || isLoading || isSolved) return;
    setFlashes((current) => [...current, position]);
    clearError();
  };

  const solve = async () => {
    if (flashes.length !== expectedFlashes) return setError(`Enter all ${expectedFlashes} flashes for stage ${stage}`);
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveSimonShrieks(round.id, bomb.id, currentModule.id, stage, flashes);
      const nextHistory = [...history, { stage, flashes: [...flashes], presses: response.output.presses }];
      setHistory(nextHistory);
      if (response.solved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
      } else {
        setStage(stage + 1);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Simon Shrieks");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStage(1);
    setFlashes([]);
    setHistory([]);
    resetSolverState();
  };

  const twitchCommands = history
    .map(({ presses }) => generateTwitchCommand({ moduleType: ModuleType.SIMON_SHRIEKS, result: { presses } }))
    .filter(Boolean);

  return <SolverLayout>
    <SolverSection title="Stage progress" description={isSolved ? "All 3 stages complete." : `Stage ${stage} of 3`}>
      <StageIndicator total={3} current={isSolved ? 4 : stage} completedThrough={isSolved ? 3 : stage - 1} />
    </SolverSection>

    {!isSolved && <SolverSection
      title={`Flashing sequence (${flashes.length}/${expectedFlashes})`}
      description="Count clockwise from the arrow: the button at the arrow is 0. Previous-stage flashes remain in the sequence."
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {POSITIONS.map((label, position) => <button
          key={label}
          type="button"
          onClick={() => addFlash(position)}
          disabled={isLoading || flashes.length >= expectedFlashes}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Add flash ${label.toLowerCase()}`}
        >
          <span className="block text-base font-bold">{position}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </button>)}
      </div>
      {flashes.length > 0 && <div className="mt-3 flex items-center gap-3">
        <ol className="flex flex-wrap gap-1" aria-label="Entered flashing sequence">
          {flashes.map((position, index) => <li key={`${index}-${position}`} className="rounded bg-muted px-2 py-1 text-sm">
            {position}
          </li>)}
        </ol>
        <button
          type="button"
          onClick={() => setFlashes((current) => current.slice(0, -1))}
          disabled={isLoading || flashes.length <= (stage === 1 ? 0 : stage * 2)}
          className="ml-auto shrink-0 text-sm font-medium text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Undo last
        </button>
      </div>}
    </SolverSection>}

    {history.length > 0 && <SolverSection title="Stage answers">
      <ol className="space-y-2">
        {history.map((entry) => <li key={entry.stage} className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
          <span className="font-medium">Stage {entry.stage}:</span>{" "}
          {entry.presses.map((color) => color.toLowerCase()).join(" → ")}
        </li>)}
      </ol>
    </SolverSection>}

    {history.length > 0 && <SolverResult
      variant="success"
      title={`Stage ${history.at(-1)?.stage} presses`}
      description={history.at(-1)?.presses.map((color) => color.toLowerCase()).join(" → ")}
    />}

    <SolverControls
      onSolve={solve}
      onReset={reset}
      isSolveDisabled={flashes.length !== expectedFlashes}
      isLoading={isLoading}
      isSolved={isSolved}
      solveText={`Solve stage ${stage}`}
      loadingText="Solving…"
    />
    <ErrorAlert error={error} />
    {twitchCommands.length > 0 && <TwitchCommandDisplay command={twitchCommands} />}
    <SolverInstructions>
      Enter every flash by its clockwise distance from the arrow. Each new stage repeats the existing sequence and adds two flashes.
    </SolverInstructions>
  </SolverLayout>;
}
