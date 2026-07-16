import { useCallback, useMemo, useState } from "react";

import { solveSkewedSlots, type SkewedSlotsOutput } from "../../services/skewedSlotsService";
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

const emptyDigits = () => ["", "", ""];

export default function SkewedSlotsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [digits, setDigits] = useState(emptyDigits);
  const [result, setResult] = useState<SkewedSlotsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ digits, result, twitchCommand }), [digits, result, twitchCommand]);

  useSolverModulePersistence<typeof moduleState, SkewedSlotsOutput>({
    state: moduleState,
    onRestoreState: useCallback((state) => {
      if (state.digits?.length === 3) setDigits(state.digits.map(String));
      if (state.result) setResult(state.result);
      if (state.twitchCommand) setTwitchCommand(state.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: SkewedSlotsOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SKEWED_SLOTS, result: solution }));
    }, []),
    extractSolution: (raw) => raw && typeof raw === "object" && "code" in raw
      ? raw as SkewedSlotsOutput
      : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const validInput = digits.every((digit) => /^\d$/.test(digit));
  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!validInput) return setError("Select all three displayed digits");
    clearError();
    setIsLoading(true);
    try {
      const input = { digits: digits.map(Number) };
      const response = await solveSkewedSlots(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.SKEWED_SLOTS, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...moduleState, digits }, response.output, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Skewed Slots");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, digits, validInput, clearError, markModuleSolved, moduleState, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setDigits(emptyDigits());
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Original slot display" description="Select the three digits shown before changing any reel.">
      <div className="mx-auto grid max-w-sm grid-cols-3 gap-3">
        {digits.map((digit, index) => <label key={index} className="text-center">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Slot {index + 1}</span>
          <select
            value={digit}
            onChange={(event) => setDigits((current) => current.map((value, i) => i === index ? event.target.value : value))}
            disabled={isLoading || isSolved}
            aria-label={`Slot ${index + 1} digit`}
            className="h-16 w-full rounded-md border border-input bg-background px-2 text-center font-mono text-3xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            <option value="">–</option>
            {Array.from({ length: 10 }, (_, value) => <option key={value}>{value}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!validInput} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Submit these digits" className="border-emerald-500/40">
      <div className="flex justify-center gap-3" aria-label={`Submit ${result.code}`}>
        {result.digits.map((digit, index) => <span key={index} className="flex h-20 w-16 items-center justify-center rounded-md border-2 border-emerald-500 bg-emerald-500/10 font-mono text-4xl font-bold text-emerald-700 dark:text-emerald-300">{digit}</span>)}
      </div>
    </SolverSection>}

    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Set the reels to the submitted digits, then press the submit button. The solver uses the bomb&apos;s recorded serial number, batteries, indicators, and ports.</SolverInstructions>
  </SolverLayout>;
}
