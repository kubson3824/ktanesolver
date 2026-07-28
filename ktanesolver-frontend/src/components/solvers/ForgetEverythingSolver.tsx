import { useCallback, useMemo, useState } from "react";

import { solveForgetEverything, type ForgetEverythingColor, type ForgetEverythingOutput } from "../../services/forgetEverythingService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const COLORS: ForgetEverythingColor[] = ["RED", "YELLOW", "GREEN", "BLUE"];
type Stage = { number: number; dials: string; nixies: string; colors: ForgetEverythingColor[] };

export default function ForgetEverythingSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState("1");
  const [dials, setDials] = useState("");
  const [nixies, setNixies] = useState("");
  const [colors, setColors] = useState<ForgetEverythingColor[]>(["RED", "RED", "RED"]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [result, setResult] = useState<ForgetEverythingOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ stage, dials, nixies, colors, stages, result, twitchCommand }), [stage, dials, nixies, colors, stages, result, twitchCommand]);

  useSolverModulePersistence<typeof state, ForgetEverythingOutput>({
    state,
    onRestoreState: useCallback((saved: Partial<typeof state>) => {
      if (saved.stage) setStage(String(saved.stage));
      if (saved.dials !== undefined) setDials(saved.dials);
      if (saved.nixies !== undefined) setNixies(saved.nixies);
      if (saved.colors?.length === 3) setColors(saved.colors);
      if (saved.stages) setStages(saved.stages);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: ForgetEverythingOutput) => {
      setResult(solution);
      if (solution.solution) setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.FORGET_EVERYTHING, result: solution }));
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const request = useCallback(async (input: Parameters<typeof solveForgetEverything>[3]) => {
    if (!round?.id || !bomb?.id || !currentModule?.id) throw new Error("Missing required information");
    return solveForgetEverything(round.id, bomb.id, currentModule.id, input);
  }, [round?.id, bomb?.id, currentModule?.id]);

  const recordStage = useCallback(async () => {
    if (!/^(?:[1-9]|[1-9]\d)$/.test(stage)) return setError("Enter a stage number from 1 to 99");
    if (!/^\d{10}$/.test(dials)) return setError("Enter exactly 10 dial digits");
    if (!/^\d{2}$/.test(nixies)) return setError("Enter exactly 2 nixie digits");
    clearError(); setIsLoading(true);
    try {
      const entry = { number: Number(stage), dials, nixies, colors };
      const response = await request({ action: "RECORD_STAGE", stage: entry.number, dials, nixies, colors });
      const nextStages = [...stages.filter((saved) => saved.number !== entry.number), entry].sort((a, b) => a.number - b.number);
      setStages(nextStages); setStage(String(entry.number + 1)); setDials(""); setNixies("");
      updateModuleAfterSolve(bomb!.id, currentModule!.id, { ...state, stage: String(entry.number + 1), dials: "", nixies: "", stages: nextStages }, response.output, false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to record stage"); }
    finally { setIsLoading(false); }
  }, [stage, dials, nixies, colors, stages, state, bomb, currentModule, clearError, request, setError, setIsLoading, updateModuleAfterSolve]);

  const finish = useCallback(async () => {
    clearError(); setIsLoading(true);
    try {
      const response = await request({ action: "FINISH" });
      const command = generateTwitchCommand({ moduleType: ModuleType.FORGET_EVERYTHING, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(true);
      markModuleSolved(bomb!.id, currentModule!.id);
      updateModuleAfterSolve(bomb!.id, currentModule!.id, state, response.output, true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to calculate the solution"); }
    finally { setIsLoading(false); }
  }, [bomb, currentModule, state, clearError, markModuleSolved, request, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(async () => {
    clearError(); setIsLoading(true);
    try {
      await request({ action: "RESET" });
      setStage("1"); setDials(""); setNixies(""); setColors(["RED", "RED", "RED"]);
      setStages([]); setResult(null); setTwitchCommand(""); resetSolverState();
      updateModuleAfterSolve(bomb!.id, currentModule!.id, {}, {}, false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to reset Forget Everything"); }
    finally { setIsLoading(false); }
  }, [bomb, currentModule, clearError, request, resetSolverState, setError, setIsLoading, updateModuleAfterSolve]);

  const disabled = isLoading || isSolved;
  return <SolverLayout>
    <SolverSection title="Displayed stage" description="Record the stage number, ten dials, two nixie tubes, and three colored lights. Stages may arrive out of order.">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium">Stage
          <Input value={stage} onChange={(event) => setStage(event.target.value)} inputMode="numeric" disabled={disabled} aria-label="Stage number" className="mt-1" />
        </label>
        <label className="text-sm font-medium sm:col-span-2">Dial digits, left to right
          <Input value={dials} onChange={(event) => setDials(event.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" maxLength={10} disabled={disabled} aria-label="Ten dial digits" className="mt-1 font-mono tracking-widest" />
        </label>
        <label className="text-sm font-medium">Nixie digits
          <Input value={nixies} onChange={(event) => setNixies(event.target.value.replace(/\D/g, "").slice(0, 2))} inputMode="numeric" maxLength={2} disabled={disabled} aria-label="Two nixie digits" className="mt-1 font-mono tracking-widest" />
        </label>
        {colors.map((color, index) => <label key={index} className="text-sm font-medium">Light {index + 1}
          <select value={color} onChange={(event) => setColors((current) => current.map((value, i) => i === index ? event.target.value as ForgetEverythingColor : value))} disabled={disabled} aria-label={`Light ${index + 1} color`} className="mt-1 block h-9 w-full rounded-md border border-input bg-background px-3">
            {COLORS.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>

    {stages.length > 0 && <SolverSection title="Recorded stages" description={`${stages.length} stage${stages.length === 1 ? "" : "s"} saved`}>
      <p className="text-center font-mono text-sm">{stages.map((entry) => entry.number).join(", ")}</p>
    </SolverSection>}
    <SolverControls onSolve={recordStage} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Record stage" />
    {stages.length > 0 && !isSolved && <Button type="button" variant="secondary" className="w-full" onClick={finish} disabled={isLoading}>Stage display is blank — calculate solution</Button>}
    <ErrorAlert error={error} />
    {result?.solution && <SolverSection title="Set the ten dials" className="border-emerald-500/40">
      <div className="text-center font-mono text-3xl font-black tracking-[0.25em] text-emerald-600" aria-label={`Set dials to ${result.solution}`}>{result.solution}</div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Do not interact with the module until its stage display is blank. Set the dials to the result, wait for them to stop, then turn the key.</SolverInstructions>
  </SolverLayout>;
}
