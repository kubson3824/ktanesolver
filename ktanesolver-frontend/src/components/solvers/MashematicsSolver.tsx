import { useCallback, useMemo, useState } from "react";

import { solveMashematics, type MashematicsInput, type MashematicsOperator, type MashematicsOutput } from "../../services/mashematicsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";

const OPERATORS: { value: MashematicsOperator; label: string }[] = [
  { value: "ADD", label: "+" },
  { value: "SUBTRACT", label: "−" },
  { value: "MULTIPLY", label: "×" },
];

function NumberField({ label, value, onChange, disabled }: { label: string; value: number; onChange: (value: number) => void; disabled: boolean }) {
  return <label className="space-y-1.5 text-sm font-medium">{label}<Input type="number" min={0} max={99} value={Number.isNaN(value) ? "" : value} onChange={(event) => onChange(event.currentTarget.valueAsNumber)} disabled={disabled} /></label>;
}

function OperatorSelect({ label, value, onChange, disabled }: { label: string; value: MashematicsOperator; onChange: (value: MashematicsOperator) => void; disabled: boolean }) {
  return <label className="space-y-1.5 text-sm font-medium">{label}<select value={value} onChange={(event) => onChange(event.target.value as MashematicsOperator)} disabled={disabled} className="block h-10 w-full rounded-md border border-input bg-background px-3 text-xl font-bold">{OPERATORS.map((operator) => <option key={operator.value} value={operator.value}>{operator.label}</option>)}</select></label>;
}

export default function MashematicsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [first, setFirst] = useState(0);
  const [firstOperator, setFirstOperator] = useState<MashematicsOperator>("ADD");
  const [second, setSecond] = useState(0);
  const [secondOperator, setSecondOperator] = useState<MashematicsOperator>("ADD");
  const [third, setThird] = useState(0);
  const [result, setResult] = useState<MashematicsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ first, firstOperator, second, secondOperator, third, result, twitchCommand }), [first, firstOperator, second, secondOperator, third, result, twitchCommand]);

  useSolverModulePersistence<typeof moduleState, MashematicsOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (typeof state.first === "number") setFirst(state.first);
      if (state.firstOperator) setFirstOperator(state.firstOperator);
      if (typeof state.second === "number") setSecond(state.second);
      if (state.secondOperator) setSecondOperator(state.secondOperator);
      if (typeof state.third === "number") setThird(state.third);
      if (state.result) setResult(state.result);
      if (state.twitchCommand) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.MASHEMATICS, result: solution }));
    },
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    const values = [first, second, third];
    if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 99)) return setError("Enter three numbers from 0 to 99");
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input: MashematicsInput = { first, firstOperator, second, secondOperator, third };
      const response = await solveMashematics(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.MASHEMATICS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Mashematics"); }
    finally { setIsLoading(false); }
  }, [first, firstOperator, second, secondOperator, third, round?.id, bomb?.id, currentModule?.id, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setFirst(0); setFirstOperator("ADD"); setSecond(0); setSecondOperator("ADD"); setThird(0);
    setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  const disabled = isLoading || isSolved;
  return <SolverLayout>
    <SolverSection title="Displayed equation" description="Enter the three numbers and two operators from left to right.">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        <NumberField label="First number" value={first} onChange={setFirst} disabled={disabled} />
        <OperatorSelect label="First operator" value={firstOperator} onChange={setFirstOperator} disabled={disabled} />
        <NumberField label="Second number" value={second} onChange={setSecond} disabled={disabled} />
        <OperatorSelect label="Second operator" value={secondOperator} onChange={setSecondOperator} disabled={disabled} />
        <NumberField label="Third number" value={third} onChange={setThird} disabled={disabled} />
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Push count" description={`The equation evaluates to ${result.rawAnswer}.`} className="border-emerald-500/40"><div className="text-center"><p className="text-6xl font-black tabular-nums">{result.pressCount}</p><p className="mt-2 text-sm text-muted-foreground">Press Push! this many times, then submit.</p></div></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Multiplication is evaluated first. Answers outside 0–99 are adjusted by 50 until they are in range.</SolverInstructions>
  </SolverLayout>;
}
