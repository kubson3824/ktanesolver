import { useCallback, useMemo, useState } from "react";
import { solveRubiksClock, type RubiksClockAction, type RubiksClockFace, type RubiksClockOutput, type RubiksClockPin } from "../../services/rubiksClockService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";
import { Button } from "../ui/button";

const CLOCKS: RubiksClockFace[] = ["TL", "T", "TR", "L", "C", "R", "BL", "B", "BR"];
const PINS: RubiksClockPin[] = ["TL", "TR", "BL", "BR"];
const LABELS: Record<RubiksClockFace, string> = {
  TL: "Top left", T: "Top", TR: "Top right", L: "Left", C: "Center",
  R: "Right", BL: "Bottom left", B: "Bottom", BR: "Bottom right",
};

function PositionSelect<T extends RubiksClockFace>({ label, values, value, onChange, disabled }: {
  label: string; values: T[]; value: T; onChange: (value: T) => void; disabled: boolean;
}) {
  return <label className="space-y-1.5 text-sm font-medium">{label}
    <select value={value} onChange={(event) => onChange(event.target.value as T)} disabled={disabled}
      className="block h-12 w-full rounded-md border border-input bg-background px-3">
      {values.map((position) => <option key={position} value={position}>{LABELS[position]}</option>)}
    </select>
  </label>;
}

export default function RubiksClockSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [litClock, setLitClock] = useState<RubiksClockFace>("TL");
  const [litPin, setLitPin] = useState<RubiksClockPin>("TL");
  const [result, setResult] = useState<RubiksClockOutput | null>(null);
  const [step, setStep] = useState(0);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ litClock, litPin, result, step, twitchCommand }), [litClock, litPin, result, step, twitchCommand]);

  useSolverModulePersistence<typeof state, RubiksClockOutput>({
    state,
    onRestoreState: useCallback((saved: Partial<typeof state>) => {
      if (saved.litClock && CLOCKS.includes(saved.litClock)) setLitClock(saved.litClock);
      if (saved.litPin && PINS.includes(saved.litPin)) setLitPin(saved.litPin);
      if (typeof saved.step === "number") setStep(saved.step);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: RubiksClockOutput) => {
      if (solution.gear) {
        setResult(solution);
        setStep(solution.step);
        setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.RUBIKS_CLOCK, result: solution }));
      }
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const request = useCallback(async (action: RubiksClockAction) => {
    if (!round?.id || !bomb?.id || !currentModule?.id) throw new Error("Missing required information");
    return solveRubiksClock(round.id, bomb.id, currentModule.id, action, litClock, litPin);
  }, [round?.id, bomb?.id, currentModule?.id, litClock, litPin]);

  const solveStep = useCallback(async () => {
    clearError(); setIsLoading(true);
    try {
      const response = await request("SOLVE_STEP");
      const command = generateTwitchCommand({ moduleType: ModuleType.RUBIKS_CLOCK, result: response.output });
      setResult(response.output); setStep(response.output.step); setTwitchCommand(command);
      updateModuleAfterSolve(bomb!.id, currentModule!.id, { litClock, litPin, result: response.output, step: response.output.step, twitchCommand: command }, response.output, false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Rubik's Clock"); }
    finally { setIsLoading(false); }
  }, [bomb, currentModule, litClock, litPin, clearError, request, setError, setIsLoading, updateModuleAfterSolve]);

  const complete = useCallback(async () => {
    clearError(); setIsLoading(true);
    try {
      await request("COMPLETE");
      setIsSolved(true);
      markModuleSolved(bomb!.id, currentModule!.id);
      updateModuleAfterSolve(bomb!.id, currentModule!.id, state, result ?? {}, true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to complete Rubik's Clock"); }
    finally { setIsLoading(false); }
  }, [bomb, currentModule, result, state, clearError, markModuleSolved, request, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(async () => {
    clearError(); setIsLoading(true);
    try {
      await request("RESET");
      setResult(null); setStep(0); setTwitchCommand(""); resetSolverState();
      updateModuleAfterSolve(bomb!.id, currentModule!.id, { litClock, litPin, result: null, step: 0, twitchCommand: "" }, {}, false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to reset Rubik's Clock"); }
    finally { setIsLoading(false); }
  }, [bomb, currentModule, litClock, litPin, clearError, request, resetSolverState, setError, setIsLoading, updateModuleAfterSolve]);

  const disabled = isLoading || isSolved;
  return <SolverLayout>
    <SolverSection title={`Instruction ${step + 1}`} description="Select the lit large clock and lit small pin on the side facing you.">
      <div className="grid gap-3 sm:grid-cols-2">
        <PositionSelect label="Lit clock" values={CLOCKS} value={litClock} onChange={setLitClock} disabled={disabled} />
        <PositionSelect label="Lit pin" values={PINS} value={litPin} onChange={setLitPin} disabled={disabled} />
      </div>
    </SolverSection>
    <SolverControls onSolve={solveStep} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate instruction" />
    <ErrorAlert error={error} />
    {result?.gear && <SolverSection title={`Instruction ${result.step}`} className="border-emerald-500/40">
      <ol className="list-decimal space-y-2 pl-5 text-lg">
        <li>Toggle the {result.pins.map((pin) => LABELS[pin].toLowerCase()).join(" and ")} pins.</li>
        <li>Rotate the {LABELS[result.gear].toLowerCase()} gear {Math.abs(result.hours)} hour{Math.abs(result.hours) === 1 ? "" : "s"} {result.hours > 0 ? "clockwise" : "counterclockwise"}.</li>
        <li>Turn the clock over.</li>
      </ol>
      {!isSolved && <Button type="button" variant="outline" className="mt-4 w-full" onClick={complete} disabled={isLoading}>All clocks show 12</Button>}
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Repeat with the newly lit clock and pin. Mark the module complete as soon as every clock on both sides shows 12.</SolverInstructions>
  </SolverLayout>;
}
