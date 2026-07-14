import { useCallback, useMemo, useState } from "react";
import { solveBitwiseOperations, type BitwiseOperationsOutput, type BitwiseOperator } from "../../services/bitwiseOperationsService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";
import { Input } from "../ui";

const OPERATORS: BitwiseOperator[] = ["AND", "OR", "XOR", "NOT"];

function Bits({ value, highlight = false }: { value: string; highlight?: boolean }) {
  return <div className="grid grid-cols-8 gap-1" aria-label={value}>
    {value.split("").map((bit, index) => <span key={index} className={`rounded border py-2 text-center font-mono text-lg font-bold ${highlight ? "border-emerald-500/50 bg-emerald-500/15" : "border-border bg-muted/40"}`}>{bit}</span>)}
  </div>;
}

export default function BitwiseOperationsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [operator, setOperator] = useState<BitwiseOperator>("AND");
  const [startingTimeMinutes, setStartingTimeMinutes] = useState(5);
  const [result, setResult] = useState<BitwiseOperationsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const savedState = useMemo(() => ({ operator, startingTimeMinutes, result, twitchCommand }), [operator, startingTimeMinutes, result, twitchCommand]);

  useSolverModulePersistence<typeof savedState, BitwiseOperationsOutput>({
    state: savedState,
    onRestoreState: useCallback((saved) => {
      if (OPERATORS.includes(saved.operator)) setOperator(saved.operator);
      if (Number.isFinite(saved.startingTimeMinutes)) setStartingTimeMinutes(saved.startingTimeMinutes);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: BitwiseOperationsOutput) => {
      setResult(solution);
      setTwitchCommand(`submit ${solution.answer}`);
    }, []),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!Number.isFinite(startingTimeMinutes) || startingTimeMinutes < 0) return setError("Enter a valid starting time in minutes");
    clearError(); setIsLoading(true);
    try {
      const input = { operator, startingTimeMinutes };
      const response = await solveBitwiseOperations(round.id, bomb.id, currentModule.id, input);
      const command = `submit ${response.output.answer}`;
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Bitwise Operations"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, operator, startingTimeMinutes, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setOperator("AND"); setStartingTimeMinutes(5); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Module display" description="Select the operator shown on the upper screen.">
      <div className="grid grid-cols-4 gap-2">
        {OPERATORS.map((value) => <button key={value} type="button" onClick={() => { setOperator(value); clearError(); }} aria-pressed={operator === value} disabled={isLoading || isSolved} className={`rounded-md border px-3 py-2 font-mono font-bold ${operator === value ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "border-border"}`}>{value}</button>)}
      </div>
      <label className="mt-4 block text-sm font-medium">Starting time in minutes
        <Input type="number" min={0} step="any" value={startingTimeMinutes} onChange={(event) => setStartingTimeMinutes(event.target.valueAsNumber)} disabled={isLoading || isSolved} className="mt-1" aria-label="Starting time in minutes" />
      </label>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate byte" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Submit this byte" className="border-emerald-500/40">
      <Bits value={result.answer} highlight />
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <div><span className="inline-block w-14 font-medium">Byte 1</span><Bits value={result.byte1} /></div>
        {operator !== "NOT" && <div><span className="inline-block w-14 font-medium">Byte 2</span><Bits value={result.byte2} /></div>}
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Bit positions run from most significant on the left to least significant on the right. NOT ignores Byte 2.</SolverInstructions>
  </SolverLayout>;
}
