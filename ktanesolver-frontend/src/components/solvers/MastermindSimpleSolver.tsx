import { useCallback, useMemo, useState } from "react";
import {
  solveMastermindSimple,
  type MastermindSimpleAttempt,
  type MastermindSimpleOutput,
} from "../../services/mastermindSimpleService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const NUMBERS = [0, 1, 2, 3, 4, 5];
const COLOR_STYLES: Record<string, string> = {
  WHITE: "bg-white text-black border-slate-300",
  MAGENTA: "bg-fuchsia-500 text-white border-fuchsia-600",
  YELLOW: "bg-yellow-400 text-black border-yellow-500",
  GREEN: "bg-green-500 text-white border-green-600",
  RED: "bg-red-500 text-white border-red-600",
  BLUE: "bg-blue-500 text-white border-blue-600",
};

type SavedState = {
  attempts: MastermindSimpleAttempt[];
  exact: number;
  misplaced: number;
  result: MastermindSimpleOutput | null;
  twitchCommand: string;
};

function Guess({ colors }: { colors: string[] }) {
  return <div className="flex flex-wrap justify-center gap-2" aria-label={colors.join(", ")}>
    {colors.map((color, index) => <span key={`${index}-${color}`} className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-xs font-bold ${COLOR_STYLES[color] ?? "bg-muted"}`} title={color}>
      {color[0]}
    </span>)}
  </div>;
}

export default function MastermindSimpleSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [attempts, setAttempts] = useState<MastermindSimpleAttempt[]>([]);
  const [exact, setExact] = useState(0);
  const [misplaced, setMisplaced] = useState(0);
  const [result, setResult] = useState<MastermindSimpleOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo<SavedState>(() => ({ attempts, exact, misplaced, result, twitchCommand }), [attempts, exact, misplaced, result, twitchCommand]);

  useSolverModulePersistence<SavedState, MastermindSimpleOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (Array.isArray(saved.attempts)) setAttempts(saved.attempts);
      if (typeof saved.exact === "number") setExact(saved.exact);
      if (typeof saved.misplaced === "number") setMisplaced(saved.misplaced);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: MastermindSimpleOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.MASTERMIND_SIMPLE, result: solution }));
    }, []),
    extractSolution: (raw) => raw && typeof raw === "object" && Array.isArray((raw as MastermindSimpleOutput).nextGuess)
      ? raw as MastermindSimpleOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (exact + misplaced > 5) return setError("Exact and misplaced counts cannot total more than five");
    clearError(); setIsLoading(true);
    try {
      const nextAttempts = result && !result.submit
        ? [...attempts, { guess: result.nextGuess, exact, misplaced }]
        : attempts;
      const response = await solveMastermindSimple(round.id, bomb.id, currentModule.id, { attempts: nextAttempts });
      const command = generateTwitchCommand({ moduleType: ModuleType.MASTERMIND_SIMPLE, result: response.output });
      setAttempts(nextAttempts); setExact(0); setMisplaced(0); setResult(response.output); setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id,
        { attempts: nextAttempts, exact: 0, misplaced: 0, result: response.output, twitchCommand: command },
        response.output, response.solved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Mastermind Simple");
    } finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, attempts, exact, misplaced, result, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setAttempts([]); setExact(0); setMisplaced(0); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    {result && <SolverSection title={result.submit ? "Submit this code" : `Query ${attempts.length + 1}`} description={`${result.remainingCandidates} possible code${result.remainingCandidates === 1 ? "" : "s"} remain.`} className={result.submit ? "border-emerald-500/40" : undefined}>
      <Guess colors={result.nextGuess} />
    </SolverSection>}

    {result && !result.submit && <SolverSection title="Query result" description="Enter the two numbers displayed after querying the code above.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">Exact colors and positions
          <select value={exact} onChange={(event) => { setExact(Number(event.target.value)); clearError(); }} disabled={isLoading} className="rounded-md border bg-background px-3 py-2">
            {NUMBERS.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">Correct colors, wrong positions
          <select value={misplaced} onChange={(event) => { setMisplaced(Number(event.target.value)); clearError(); }} disabled={isLoading} className="rounded-md border bg-background px-3 py-2">
            {NUMBERS.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      </div>
    </SolverSection>}

    {attempts.length > 0 && <SolverSection title="Previous queries">
      <ol className="space-y-2 text-sm">
        {attempts.map((attempt, index) => <li key={index} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2">
          <span>{index + 1}. {attempt.guess.map((color) => color[0]).join(" ")}</span>
          <span>{attempt.exact} exact · {attempt.misplaced} misplaced</span>
        </li>)}
      </ol>
    </SolverSection>}

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved}
      isSolveDisabled={Boolean(result && !result.submit && exact + misplaced > 5)}
      solveText={result ? "Apply feedback" : "Get first query"} />
    <ErrorAlert error={error} />
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Use Query for each suggested code, then enter the left exact count and right misplaced count. Repeated colors are allowed.</SolverInstructions>
  </SolverLayout>;
}
