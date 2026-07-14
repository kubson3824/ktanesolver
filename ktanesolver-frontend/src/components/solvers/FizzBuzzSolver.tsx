import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import {
  solveFizzBuzz,
  type FizzBuzzColor,
  type FizzBuzzDisplay,
  type FizzBuzzInput,
  type FizzBuzzOutput,
} from "../../services/fizzBuzzService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";

const POSITIONS = ["Top", "Middle", "Bottom"];
const COLORS: { name: FizzBuzzColor; className: string }[] = [
  { name: "RED", className: "bg-red-500" },
  { name: "GREEN", className: "bg-green-500" },
  { name: "BLUE", className: "bg-blue-500" },
  { name: "YELLOW", className: "bg-yellow-400" },
  { name: "WHITE", className: "bg-white" },
];
const ACTION_LABELS = {
  NUMBER: "Leave as number",
  FIZZ: "FIZZ",
  BUZZ: "BUZZ",
  FIZZBUZZ: "FIZZBUZZ",
} as const;

const emptyDisplays = (): FizzBuzzDisplay[] => POSITIONS.map(() => ({ number: "", color: "RED" }));

export default function FizzBuzzSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [displays, setDisplays] = useState<FizzBuzzDisplay[]>(emptyDisplays);
  const [result, setResult] = useState<FizzBuzzOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ displays, result, twitchCommand }), [displays, result, twitchCommand]);
  const valid = displays.every((display) => /^\d{7}$/.test(display.number));

  const onRestoreState = useCallback((state: Partial<typeof moduleState> & { input?: Partial<FizzBuzzInput> }) => {
    const input = state.input ?? state;
    if (input.displays?.length === 3) setDisplays(input.displays);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: FizzBuzzOutput) => {
    if (!solution?.actions) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.FIZZ_BUZZ, result: solution }));
  }, []);

  useSolverModulePersistence<typeof moduleState, FizzBuzzOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as FizzBuzzOutput & { output?: FizzBuzzOutput };
      return value.output ?? value;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const updateDisplay = (index: number, patch: Partial<FizzBuzzDisplay>) => {
    setDisplays((current) => current.map((display, position) => position === index ? { ...display, ...patch } : display));
    setResult(null);
    setTwitchCommand("");
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!valid) return setError("Enter exactly seven digits for all three displays");
    clearError();
    setIsLoading(true);
    try {
      const input = { displays };
      const response = await solveFizzBuzz(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.FIZZ_BUZZ, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { input, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve FizzBuzz");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, valid, displays, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setDisplays(emptyDisplays());
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return (
    <SolverLayout>
      <SolverSection title="Displayed numbers" description="Enter the three seven-digit numbers and their text colors.">
        <div className="grid gap-3">
          {displays.map((display, index) => (
            <div key={POSITIONS[index]} className="grid gap-2 rounded-md border bg-muted/20 p-3 sm:grid-cols-[5rem_1fr_10rem] sm:items-center">
              <span className="font-medium">{POSITIONS[index]}</span>
              <label>
                <span className="sr-only">{POSITIONS[index]} seven-digit number</span>
                <Input
                  value={display.number}
                  onChange={(event) => updateDisplay(index, { number: event.target.value.replace(/\D/g, "").slice(0, 7) })}
                  inputMode="numeric"
                  pattern="[0-9]{7}"
                  maxLength={7}
                  placeholder="0000000"
                  className="font-mono text-lg tracking-widest"
                  disabled={isLoading || isSolved}
                />
              </label>
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background px-3">
                <span className={cn("h-4 w-4 rounded-full border border-black/40", COLORS.find((color) => color.name === display.color)?.className)} aria-hidden />
                <span className="sr-only">{POSITIONS[index]} number color</span>
                <select
                  value={display.color}
                  onChange={(event) => updateDisplay(index, { color: event.target.value as FizzBuzzColor })}
                  disabled={isLoading || isSolved}
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
                >
                  {COLORS.map((color) => <option key={color.name} value={color.name}>{color.name}</option>)}
                </select>
              </label>
            </div>
          ))}
        </div>
      </SolverSection>

      <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!valid} isLoading={isLoading} isSolved={isSolved} solveText="Get display states" />
      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Set displays and submit" className="border-emerald-500/40">
          <ol className="grid gap-3 sm:grid-cols-3">
            {result.actions.map((action, index) => (
              <li key={POSITIONS[index]} className="rounded-md border bg-emerald-500/10 p-4 text-center">
                <div className="text-sm text-muted-foreground">{POSITIONS[index]}</div>
                <div className="mt-1 break-words font-mono text-xl font-bold">{action === "NUMBER" ? displays[index].number : ACTION_LABELS[action]}</div>
                {action === "NUMBER" && <div className="mt-1 text-sm font-medium">{ACTION_LABELS.NUMBER}</div>}
              </li>
            ))}
          </ol>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>The solver uses the bomb's recorded batteries, holders, ports, serial number, and current strikes. If the strike count crosses two before submission, reset and solve again.</SolverInstructions>
    </SolverLayout>
  );
}
