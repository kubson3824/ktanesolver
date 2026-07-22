import { useCallback, useMemo, useState } from "react";
import {
  solveWasteManagement,
  type WasteManagementInput,
  type WasteManagementOutput,
  type WasteTimerBand,
} from "../../services/wasteManagementService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Input } from "../ui";

const TIMER_BANDS: Array<{ value: WasteTimerBand; label: string }> = [
  { value: "MORE_THAN_HALF", label: "More than half remains" },
  { value: "HALF_OR_LESS", label: "At/below half, before the last fifth" },
  { value: "LAST_FIFTH", label: "In the last fifth" },
];

type PersistedState = {
  timerBand: WasteTimerBand;
  additionalModuleNames: string;
  result: WasteManagementOutput | null;
  stageIndex: number;
  barEmpty: boolean;
};

export default function WasteManagementSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [timerBand, setTimerBand] = useState<WasteTimerBand>("MORE_THAN_HALF");
  const [additionalModuleNames, setAdditionalModuleNames] = useState("");
  const [result, setResult] = useState<WasteManagementOutput | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [barEmpty, setBarEmpty] = useState(false);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo<PersistedState>(() => ({
    timerBand, additionalModuleNames, result, stageIndex, barEmpty,
  }), [timerBand, additionalModuleNames, result, stageIndex, barEmpty]);

  useSolverModulePersistence<PersistedState, WasteManagementOutput>({
    state,
    onRestoreState: useCallback((saved: PersistedState & { input?: Partial<WasteManagementInput> }) => {
      const input = saved.input ?? saved;
      if (input.timerBand) setTimerBand(input.timerBand);
      if (Array.isArray(input.additionalModuleNames)) setAdditionalModuleNames(input.additionalModuleNames.join(", "));
      else if (typeof saved.additionalModuleNames === "string") setAdditionalModuleNames(saved.additionalModuleNames);
      if (saved.result) setResult(saved.result);
      if (Number.isInteger(saved.stageIndex)) setStageIndex(saved.stageIndex);
      if (typeof saved.barEmpty === "boolean") setBarEmpty(saved.barEmpty);
    }, []),
    onRestoreSolution: useCallback((solution: WasteManagementOutput) => {
      if (solution?.allocations) setResult(solution);
    }, []),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const names = additionalModuleNames.split(",").map((name) => name.trim()).filter(Boolean);
    clearError(); setIsLoading(true);
    try {
      const input: WasteManagementInput = { timerBand, additionalModuleNames: names };
      const response = await solveWasteManagement(round.id, bomb.id, currentModule.id, input);
      setResult(response.output); setStageIndex(0); setBarEmpty(false); setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        ...input, additionalModuleNames, result: response.output, stageIndex: 0, barEmpty: false,
      }, response.output, true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Waste Management"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, timerBand, additionalModuleNames, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setTimerBand("MORE_THAN_HALF"); setAdditionalModuleNames(""); setResult(null);
    setStageIndex(0); setBarEmpty(false); resetSolverState();
  }, [resetSolverState]);

  const stages = result?.allocations.filter((allocation, index) => index < 3 || allocation.total > 0) ?? [];
  const twitchCommand = result ? generateTwitchCommand({
    moduleType: ModuleType.WASTE_MANAGEMENT,
    result: { ...result, stageIndex, barEmpty },
  }) : "";

  return <SolverLayout>
    <SolverSection title="Submission snapshot" description="Time and strikes are fixed when you first press the green submit button.">
      <label className="block text-sm font-medium">Timer position
        <select aria-label="Timer position" value={timerBand} onChange={(event) => setTimerBand(event.target.value as WasteTimerBand)} disabled={isLoading || isSolved} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          {TIMER_BANDS.map((band) => <option key={band.value} value={band.value}>{band.label}</option>)}
        </select>
      </label>
      <label className="mt-4 block text-sm font-medium">Unsupported module names, comma-separated
        <Input aria-label="Unsupported module names" value={additionalModuleNames} onChange={(event) => setAdditionalModuleNames(event.target.value)} disabled={isLoading || isSolved} placeholder="Simon Sends, Other Module" className="mt-1" />
      </label>
      <p className="mt-2 text-xs text-muted-foreground">List only modules absent from this bomb’s setup. They affect the module count and the Morse/Forget Me Not rules.</p>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate allocations" />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Enter these amounts in order" className="border-emerald-500/40">
      <div className="grid gap-3 sm:grid-cols-2">
        {stages.map((allocation, index) => <div key={allocation.material} className="rounded-md border bg-emerald-500/10 p-4">
          <div className="text-sm text-muted-foreground">Stage {index + 1} · {allocation.total} total</div>
          <div className="mt-1 text-xl font-bold">{allocation.material}</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <span className="rounded bg-background p-2">Recycle <strong>{allocation.recycle}</strong></span>
            <span className="rounded bg-background p-2">Waste <strong>{allocation.waste}</strong></span>
          </div>
          {allocation.unused > 0 && <p className="mt-2 text-xs text-muted-foreground">Do not enter the remaining {allocation.unused} at this stage.</p>}
        </div>)}
      </div>
    </SolverSection>}

    {result && <SolverSection title="Twitch command for one safe step" description="Generate only the next stage; after submitting, inspect the physical bar before continuing.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Current material
          <select aria-label="Current material" value={stageIndex} onChange={(event) => setStageIndex(Number(event.target.value))} disabled={isLoading || barEmpty} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            {stages.map((allocation, index) => <option key={allocation.material} value={index}>{allocation.material}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end rounded-md border p-2 text-sm">
          <input type="checkbox" checked={barEmpty} onChange={(event) => setBarEmpty(event.target.checked)} disabled={isLoading} />
          The bar is empty after the previous submit
        </label>
      </div>
      <TwitchCommandDisplay command={twitchCommand} className="mt-4" />
    </SolverSection>}

    <SolverInstructions>Enter the waste amount and press W, enter the recycle amount and press R, then press green. If the bar empties after a stage, press green again immediately before entering the next material.</SolverInstructions>
  </SolverLayout>;
}
