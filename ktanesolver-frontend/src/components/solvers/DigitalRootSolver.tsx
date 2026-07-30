import { useCallback, useMemo, useState } from "react";

import { solveDigitalRoot, type DigitalRootInput, type DigitalRootOutput } from "../../services/digitalRootService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";

function DigitField({ label, value, onChange, disabled }: { label: string; value: number; onChange: (value: number) => void; disabled: boolean }) {
  return <label className="space-y-1.5 text-sm font-medium">{label}<Input type="number" min={0} max={9} value={Number.isNaN(value) ? "" : value} onChange={(event) => onChange(event.currentTarget.valueAsNumber)} disabled={disabled} /></label>;
}

export default function DigitalRootSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [first, setFirst] = useState(Number.NaN);
  const [second, setSecond] = useState(Number.NaN);
  const [third, setThird] = useState(Number.NaN);
  const [displayedRoot, setDisplayedRoot] = useState(Number.NaN);
  const [result, setResult] = useState<DigitalRootOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ first, second, third, displayedRoot, result, twitchCommand }),
    [first, second, third, displayedRoot, result, twitchCommand],
  );

  useSolverModulePersistence<typeof moduleState, DigitalRootOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (typeof state.first === "number") setFirst(state.first);
      if (typeof state.second === "number") setSecond(state.second);
      if (typeof state.third === "number") setThird(state.third);
      if (typeof state.displayedRoot === "number") setDisplayedRoot(state.displayedRoot);
      if (state.result) setResult(state.result);
      if (state.twitchCommand) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.DIGITAL_ROOT, result: solution }));
    },
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    const digits = [first, second, third, displayedRoot];
    if (digits.some((digit) => !Number.isInteger(digit) || digit < 0 || digit > 9)) return setError("Enter all four displayed digits");
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const input: DigitalRootInput = { first, second, third, displayedRoot };
      const response = await solveDigitalRoot(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.DIGITAL_ROOT, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Digital Root");
    } finally {
      setIsLoading(false);
    }
  }, [first, second, third, displayedRoot, round?.id, bomb?.id, currentModule?.id, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setFirst(Number.NaN);
    setSecond(Number.NaN);
    setThird(Number.NaN);
    setDisplayedRoot(Number.NaN);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  const disabled = isLoading || isSolved;
  return <SolverLayout>
    <SolverSection title="Displayed numbers" description="Enter the three upper digits from left to right, then the lower digit.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DigitField label="First upper digit" value={first} onChange={setFirst} disabled={disabled} />
        <DigitField label="Second upper digit" value={second} onChange={setSecond} disabled={disabled} />
        <DigitField label="Third upper digit" value={third} onChange={setThird} disabled={disabled} />
        <DigitField label="Lower digit" value={displayedRoot} onChange={setDisplayedRoot} disabled={disabled} />
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press" description={`The digital root is ${result.digitalRoot}.`} className="border-emerald-500/40"><p className="text-center text-6xl font-black">{result.button}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Add the upper digits and repeatedly add the digits of the result until one digit remains.</SolverInstructions>
  </SolverLayout>;
}
