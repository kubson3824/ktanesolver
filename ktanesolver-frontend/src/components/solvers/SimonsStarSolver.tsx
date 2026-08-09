import { useCallback, useMemo, useState } from "react";
import {
  SIMONS_STAR_COLORS, solveSimonsStar,
  type SimonsStarColor, type SimonsStarOutput,
} from "../../services/simonsStarService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  StageIndicator, TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const POSITIONS = ["North", "Second clockwise", "Third clockwise", "Fourth clockwise", "Fifth clockwise"];
type StageResult = SimonsStarOutput & { flash: SimonsStarColor; digit: number };

export default function SimonsStarSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [buttonColors, setButtonColors] = useState<SimonsStarColor[]>([...SIMONS_STAR_COLORS]);
  const [flash, setFlash] = useState<SimonsStarColor>("RED");
  const [digit, setDigit] = useState(0);
  const [history, setHistory] = useState<StageResult[]>([]);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const stage = Math.min(history.length + 1, 5);
  const state = useMemo(() => ({ buttonColors, flash, digit, history }), [buttonColors, flash, digit, history]);

  useSolverModulePersistence<typeof state, SimonsStarOutput | null>({
    state,
    onRestoreState: useCallback((raw) => {
      const saved = raw as unknown as Record<string, unknown>;
      if (Array.isArray(saved.buttonColors) && saved.buttonColors.length === 5) setButtonColors(saved.buttonColors as SimonsStarColor[]);
      if (Array.isArray(saved.flashes) && Array.isArray(saved.digits) && Array.isArray(saved.presses)) {
        const flashes = saved.flashes as SimonsStarColor[];
        const digits = saved.digits as number[];
        const presses = saved.presses as SimonsStarColor[];
        setHistory(presses.map((_, index) => ({ stage: index + 1, flash: flashes[index], digit: digits[index], presses: presses.slice(0, index + 1) })));
      } else if (Array.isArray(saved.history)) setHistory(saved.history as StageResult[]);
    }, []),
    onRestoreSolution: () => undefined,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const updateButton = (index: number, color: SimonsStarColor) => {
    setButtonColors((current) => current.map((value, position) => position === index ? color : value));
    clearError();
  };

  const solve = async () => {
    if (new Set(buttonColors).size !== 5) return setError("Use each button color exactly once");
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveSimonsStar(round.id, bomb.id, currentModule.id, { buttonColors, flash, digit });
      setHistory((current) => [...current, { ...response.output, flash, digit }]);
      if (response.solved) { setIsSolved(true); markModuleSolved(bomb.id, currentModule.id); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Simon's Star"); }
    finally { setIsLoading(false); }
  };

  const reset = () => {
    setButtonColors([...SIMONS_STAR_COLORS]); setFlash("RED"); setDigit(0); setHistory([]); resetSolverState();
  };
  const commands = history.map(({ presses }) => generateTwitchCommand({ moduleType: ModuleType.SIMONS_STAR, result: { presses } })).filter(Boolean);

  return <SolverLayout>
    <SolverSection title="Stage progress" description={isSolved ? "All five stages complete." : `Stage ${stage} of 5`}>
      <StageIndicator total={5} current={isSolved ? 6 : stage} completedThrough={isSolved ? 5 : stage - 1} />
    </SolverSection>
    <SolverSection title="Button colors" description="Enter the physical buttons clockwise from north. They stay fixed for all stages.">
      <div className="grid gap-2 sm:grid-cols-5">
        {buttonColors.map((color, index) => <label key={POSITIONS[index]} className="text-sm font-medium">{POSITIONS[index]}
          <select aria-label={`${POSITIONS[index]} button color`} value={color} onChange={(event) => updateButton(index, event.target.value as SimonsStarColor)} disabled={isLoading || isSolved || history.length > 0} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-2">
            {SIMONS_STAR_COLORS.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>
    {!isSolved && <SolverSection title={`Stage ${stage} observation`} description="Enter only the newly added flash and the settled central digit.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Flashed color
          <select aria-label="Flashed color" value={flash} onChange={(event) => { setFlash(event.target.value as SimonsStarColor); clearError(); }} disabled={isLoading} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
            {SIMONS_STAR_COLORS.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Central digit
          <select aria-label="Central digit" value={digit} onChange={(event) => { setDigit(Number(event.target.value)); clearError(); }} disabled={isLoading} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
            {[0, 1, 2, 3, 4].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      </div>
    </SolverSection>}
    {history.length > 0 && <SolverSection title="Stage answers">
      <ol className="space-y-2" aria-live="polite">{history.map((entry) => <li key={entry.stage} className="rounded-md border border-border px-3 py-2 text-sm">
        <span className="font-medium">Stage {entry.stage}:</span> {entry.presses.map((color) => color.toLowerCase()).join(" → ")}
      </li>)}</ol>
    </SolverSection>}
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText={`Solve stage ${stage}`} />
    <ErrorAlert error={error} />
    {commands.length > 0 && <TwitchCommandDisplay command={commands} />}
    <SolverInstructions>At every stage, press the full displayed answer from stage 1 through the current stage. The generated command already includes that cumulative sequence.</SolverInstructions>
  </SolverLayout>;
}
