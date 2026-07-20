import { useCallback, useMemo, useState } from "react";
import {
  solveMastermindCruel,
  type MastermindCruelAttempt,
  type MastermindCruelOutput,
} from "../../services/mastermindCruelService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const COLORS = ["WHITE", "MAGENTA", "YELLOW", "GREEN", "RED", "BLUE"];
const COLOR_STYLES: Record<string, string> = {
  WHITE: "bg-white text-black border-slate-300",
  MAGENTA: "bg-fuchsia-500 text-white border-fuchsia-600",
  YELLOW: "bg-yellow-400 text-black border-yellow-500",
  GREEN: "bg-green-500 text-white border-green-600",
  RED: "bg-red-500 text-white border-red-600",
  BLUE: "bg-blue-500 text-white border-blue-600",
};

type SavedState = {
  attempts: MastermindCruelAttempt[];
  leftColor: string;
  leftNumber: number;
  rightColor: string;
  rightNumber: number;
  solvedModules: number;
  strikes: number;
  result: MastermindCruelOutput | null;
  twitchCommand: string;
};

function Guess({ colors }: { colors: string[] }) {
  return <div className="flex flex-wrap justify-center gap-2" aria-label={colors.join(", ")}>
    {colors.map((color, index) => <span key={`${index}-${color}`} className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-xs font-bold ${COLOR_STYLES[color] ?? "bg-muted"}`} title={color}>
      {color[0]}
    </span>)}
  </div>;
}

function DisplayInput({ side, color, number, setColor, setNumber, disabled }: {
  side: string;
  color: string;
  number: number;
  setColor: (value: string) => void;
  setNumber: (value: number) => void;
  disabled: boolean;
}) {
  return <fieldset className="grid gap-2 rounded-md border p-3">
    <legend className="px-1 text-sm font-semibold">{side} display</legend>
    <label className="grid gap-1 text-sm font-medium">Color
      <select value={color} onChange={(event) => setColor(event.target.value)} disabled={disabled} className="rounded-md border bg-background px-3 py-2">
        {COLORS.map((value) => <option key={value}>{value}</option>)}
      </select>
    </label>
    <label className="grid gap-1 text-sm font-medium">Number
      <input type="number" min={0} value={number} onChange={(event) => setNumber(Number(event.target.value))} disabled={disabled} className="rounded-md border bg-background px-3 py-2" />
    </label>
  </fieldset>;
}

export default function MastermindCruelSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [attempts, setAttempts] = useState<MastermindCruelAttempt[]>([]);
  const [leftColor, setLeftColor] = useState("WHITE");
  const [leftNumber, setLeftNumber] = useState(0);
  const [rightColor, setRightColor] = useState("WHITE");
  const [rightNumber, setRightNumber] = useState(0);
  const [solvedModules, setSolvedModules] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [result, setResult] = useState<MastermindCruelOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo<SavedState>(() => ({
    attempts, leftColor, leftNumber, rightColor, rightNumber, solvedModules, strikes, result, twitchCommand,
  }), [attempts, leftColor, leftNumber, rightColor, rightNumber, solvedModules, strikes, result, twitchCommand]);

  useSolverModulePersistence<SavedState, MastermindCruelOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (Array.isArray(saved.attempts)) setAttempts(saved.attempts);
      if (COLORS.includes(saved.leftColor)) setLeftColor(saved.leftColor);
      if (typeof saved.leftNumber === "number") setLeftNumber(saved.leftNumber);
      if (COLORS.includes(saved.rightColor)) setRightColor(saved.rightColor);
      if (typeof saved.rightNumber === "number") setRightNumber(saved.rightNumber);
      if (typeof saved.solvedModules === "number") setSolvedModules(saved.solvedModules);
      if (typeof saved.strikes === "number") setStrikes(saved.strikes);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: MastermindCruelOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.MASTERMIND_CRUEL, result: solution }));
    }, []),
    extractSolution: (raw) => raw && typeof raw === "object" && Array.isArray((raw as MastermindCruelOutput).nextGuess)
      ? raw as MastermindCruelOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (leftNumber < 0 || rightNumber < 0 || solvedModules < 0 || strikes < 0) return setError("Display and edgework numbers cannot be negative");
    clearError(); setIsLoading(true);
    try {
      const nextAttempts = result && !result.submit ? [...attempts, {
        guess: result.nextGuess,
        leftColor,
        leftNumber,
        rightColor,
        rightNumber,
        solvedModules,
        strikes,
      }] : attempts;
      const response = await solveMastermindCruel(round.id, bomb.id, currentModule.id, { attempts: nextAttempts });
      const command = generateTwitchCommand({ moduleType: ModuleType.MASTERMIND_CRUEL, result: response.output });
      const currentSolvedModules = bomb.modules.filter((module) => module.solved).length;
      setAttempts(nextAttempts); setLeftNumber(0); setRightNumber(0); setSolvedModules(currentSolvedModules); setStrikes(bomb.strikes);
      setResult(response.output); setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id,
        { attempts: nextAttempts, leftColor, leftNumber: 0, rightColor, rightNumber: 0, solvedModules: currentSolvedModules, strikes: bomb.strikes, result: response.output, twitchCommand: command },
        response.output, response.solved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Mastermind Cruel");
    } finally { setIsLoading(false); }
  }, [round?.id, bomb, currentModule?.id, attempts, leftColor, leftNumber, rightColor, rightNumber, solvedModules, strikes, result, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setAttempts([]); setLeftColor("WHITE"); setLeftNumber(0); setRightColor("WHITE"); setRightNumber(0);
    setSolvedModules(0); setStrikes(0);
    setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    {result && <SolverSection title={result.submit ? "Submit this code" : `Query ${attempts.length + 1}`} description={`${result.remainingCandidates} possible code${result.remainingCandidates === 1 ? "" : "s"} remain.`} className={result.submit ? "border-emerald-500/40" : undefined}>
      <Guess colors={result.nextGuess} />
    </SolverSection>}

    {result && !result.submit && <SolverSection title="Obfuscated query result" description={`Enter both colored display values. Current snapshot: ${bomb?.modules.filter((module) => module.solved).length ?? 0} solved modules, ${bomb?.strikes ?? 0} strikes.`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <DisplayInput side="Left" color={leftColor} number={leftNumber} setColor={(value) => { setLeftColor(value); clearError(); }} setNumber={(value) => { setLeftNumber(value); clearError(); }} disabled={isLoading} />
        <DisplayInput side="Right" color={rightColor} number={rightNumber} setColor={(value) => { setRightColor(value); clearError(); }} setNumber={(value) => { setRightNumber(value); clearError(); }} disabled={isLoading} />
      </div>
      {rightColor === "WHITE" && <label className="mt-3 grid gap-1 text-sm font-medium">Solved modules when queried
        <input type="number" min={0} value={solvedModules} onChange={(event) => setSolvedModules(Number(event.target.value))} disabled={isLoading} className="rounded-md border bg-background px-3 py-2" />
      </label>}
      {rightColor === "RED" && <label className="mt-3 grid gap-1 text-sm font-medium">Strikes when queried
        <input type="number" min={0} value={strikes} onChange={(event) => setStrikes(Number(event.target.value))} disabled={isLoading} className="rounded-md border bg-background px-3 py-2" />
      </label>}
    </SolverSection>}

    {attempts.length > 0 && <SolverSection title="Previous queries">
      <ol className="space-y-2 text-sm">
        {attempts.map((attempt, index) => <li key={index} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2">
          <span>{index + 1}. {attempt.guess.map((color) => color[0]).join(" ")}</span>
          <span>{attempt.leftNumber} {attempt.leftColor.toLowerCase()} · {attempt.rightNumber} {attempt.rightColor.toLowerCase()}</span>
        </li>)}
      </ol>
    </SolverSection>}

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved}
      isSolveDisabled={leftNumber < 0 || rightNumber < 0 || solvedModules < 0 || strikes < 0}
      solveText={result ? "Decode feedback" : "Get first query"} />
    <ErrorAlert error={error} />
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Use Query for each suggested code, then copy both display numbers and their text colors. Repeated colors are allowed.</SolverInstructions>
  </SolverLayout>;
}
