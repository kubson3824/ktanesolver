import { useCallback, useMemo, useState } from "react";

import { solveTheCode, type TheCodeInput, type TheCodeOutput } from "../../services/theCodeService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";

export default function TheCodeSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [displayedNumber, setDisplayedNumber] = useState<number | null>(null);
  const [result, setResult] = useState<TheCodeOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ displayedNumber, result }), [displayedNumber, result]);

  useSolverModulePersistence<typeof state, TheCodeOutput>({
    state,
    onRestoreState: (saved) => {
      if(typeof saved.displayedNumber === "number") setDisplayedNumber(saved.displayedNumber);
      if(saved.result) setResult(saved.result);
    },
    onRestoreSolution: setResult,
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if(!Number.isInteger(displayedNumber) || displayedNumber === null || displayedNumber < 999 || displayedNumber > 9999) {
      return setError("Enter the displayed number from 999 to 9999");
    }
    if(!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const input: TheCodeInput = { displayedNumber };
      const response = await solveTheCode(round.id, bomb.id, currentModule.id, input);
      setResult(response.output);
      setIsSolved(response.solved);
      if(response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output }, response.output, response.solved);
    } catch(cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve The Code");
    } finally {
      setIsLoading(false);
    }
  }, [displayedNumber, round?.id, bomb?.id, currentModule?.id, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setDisplayedNumber(null);
    setResult(null);
    resetSolverState();
  }, [resetSolverState]);

  const twitchCommand = result
    ? generateTwitchCommand({ moduleType: ModuleType.THE_CODE, result })
    : "";

  return <SolverLayout>
    <SolverSection title="Displayed number" description="Enter the number shown at the top of the module.">
      <label className="space-y-1.5 text-sm font-medium">Number
        <Input
          aria-label="Displayed number"
          type="number"
          inputMode="numeric"
          min={999}
          max={9999}
          value={displayedNumber ?? ""}
          onChange={(event) => setDisplayedNumber(event.currentTarget.value === "" ? null : event.currentTarget.valueAsNumber)}
          disabled={isLoading || isSolved}
        />
      </label>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate code" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Submit this code" className="border-emerald-500/40">
      <p aria-live="polite" className="text-center font-mono text-5xl font-black tracking-[0.2em]">{result.code}</p>
      <TwitchCommandDisplay command={twitchCommand} className="mt-4" />
    </SolverSection>}
    <SolverInstructions>The first matching rule wins: equal first and last serial digits with no batteries, CLR, X/Y/Z, at least five ports, no batteries, more lit than unlit indicators, then the default rule.</SolverInstructions>
  </SolverLayout>;
}
