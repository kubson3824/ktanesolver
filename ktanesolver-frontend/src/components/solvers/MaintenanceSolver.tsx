import { useCallback, useMemo, useState } from "react";

import { solveMaintenance, type MaintenanceOutput } from "../../services/maintenanceService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverResult,
  SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

type SavedState = {
  numberPlate?: string;
  numberOfJobs?: number;
  result?: MaintenanceOutput | null;
};

export default function MaintenanceSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [numberPlate, setNumberPlate] = useState("");
  const [numberOfJobs, setNumberOfJobs] = useState(2);
  const [result, setResult] = useState<MaintenanceOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo<SavedState>(() => ({ numberPlate, numberOfJobs, result }), [numberPlate, numberOfJobs, result]);

  useSolverModulePersistence<SavedState, MaintenanceOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (saved.numberPlate !== undefined) setNumberPlate(saved.numberPlate);
      if (saved.numberOfJobs !== undefined) setNumberOfJobs(saved.numberOfJobs);
      if (saved.result) setResult(saved.result);
    }, []),
    onRestoreSolution: useCallback((solution: MaintenanceOutput) => {
      setResult(solution);
      if (solution.input) {
        setNumberPlate(solution.input.numberPlate);
        setNumberOfJobs(solution.input.numberOfJobs);
      }
    }, []),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveMaintenance(round.id, bomb.id, currentModule.id, { numberPlate, numberOfJobs });
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id,
        { numberPlate, numberOfJobs, result: response.output }, response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Maintenance");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, numberPlate, numberOfJobs, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setNumberPlate(""); setNumberOfJobs(2); setResult(null); resetSolverState();
  }, [resetSolverState]);

  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.MAINTENANCE, result }) : "";

  return <SolverLayout>
    <SolverSection title="Car details" description="Enter the displayed number plate and the number of jobs written on the memo.">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          <span>Number plate</span>
          <input
            value={numberPlate}
            onChange={(event) => { setNumberPlate(event.target.value.toUpperCase()); setResult(null); clearError(); }}
            disabled={isLoading || isSolved}
            placeholder="BN69 MMA"
            autoComplete="off"
            aria-describedby="maintenance-plate-help"
            className="h-10 w-full rounded-md border border-input bg-background px-3 font-mono uppercase"
          />
          <span id="maintenance-plate-help" className="block text-xs font-normal text-muted-foreground">Format: two letters, two digits, three letters</span>
        </label>
        <label className="space-y-1 text-sm font-medium">
          <span>Jobs on memo</span>
          <select
            value={numberOfJobs}
            onChange={(event) => { setNumberOfJobs(Number(event.target.value)); setResult(null); clearError(); }}
            disabled={isLoading || isSolved}
            className="h-10 w-full rounded-md border border-input bg-background px-3"
          >
            {[2, 3, 4].map((count) => <option key={count} value={count}>{count} jobs</option>)}
          </select>
        </label>
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!numberPlate.trim()} />
    <ErrorAlert error={error} />
    {result && <SolverResult
      variant={result.writeOff ? "warning" : "success"}
      title={result.writeOff ? "Select Write-off" : "Perform these jobs in order"}
      description={`Jobs: ${result.jobs.join(" → ")}\nCar: ${result.model}, ${result.manufactured}\nInsurance: ${result.insuranceCompany}\nVenn region: ${result.vennLetter}\nValue / uncovered cost: £${result.carValue} / £${result.uncoveredCost}`}
    />}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Use the full number plate shown on the module. If the car is not written off, submit each displayed repair in the order listed.</SolverInstructions>
  </SolverLayout>;
}
