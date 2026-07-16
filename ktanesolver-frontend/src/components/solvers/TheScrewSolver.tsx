import { useCallback, useMemo, useState } from "react";
import { solveTheScrew, type TheScrewOutput } from "../../services/theScrewService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, StageIndicator, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";
import { Button } from "../ui";

const COLORS = ["RED", "YELLOW", "GREEN", "BLUE", "MAGENTA", "WHITE"];
const LETTERS = ["A", "B", "C", "D"];
const COLOR_HEX: Record<string, string> = { RED: "#dc2626", YELLOW: "#eab308", GREEN: "#16a34a", BLUE: "#2563eb", MAGENTA: "#d946ef", WHITE: "#ffffff" };

interface SavedState {
  holeColors?: string[];
  buttonLabels?: string[];
  completedStages?: number;
  stage?: number;
  result?: TheScrewOutput | null;
  twitchCommand?: string;
}

function PermutationSelect({ label, value, values, selected, onChange, disabled }: { label: string; value: string; values: string[]; selected: string[]; onChange: (value: string) => void; disabled: boolean }) {
  return <label className="text-sm font-medium">{label}
    <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
      <option value="">Select</option>
      {values.map((option) => <option key={option} disabled={option !== value && selected.includes(option)}>{option}</option>)}
    </select>
  </label>;
}

export default function TheScrewSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [holeColors, setHoleColors] = useState<string[]>(Array(6).fill(""));
  const [buttonLabels, setButtonLabels] = useState<string[]>(Array(4).fill(""));
  const [completedStages, setCompletedStages] = useState(0);
  const [result, setResult] = useState<TheScrewOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ holeColors, buttonLabels, completedStages, result, twitchCommand }), [holeColors, buttonLabels, completedStages, result, twitchCommand]);

  useSolverModulePersistence<SavedState, TheScrewOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (saved.holeColors?.length === 6) setHoleColors(saved.holeColors);
      if (saved.buttonLabels?.length === 4) setButtonLabels(saved.buttonLabels);
      if (typeof saved.completedStages === "number") setCompletedStages(saved.completedStages);
      else if (typeof saved.stage === "number") setCompletedStages(saved.stage);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: TheScrewOutput) => {
      setResult(solution); setCompletedStages(solution.stage);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.THE_SCREW, result: solution }));
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (holeColors.some((color) => !color) || new Set(holeColors).size !== 6) return setError("Select each hole color exactly once");
    if (buttonLabels.some((label) => !label) || new Set(buttonLabels).size !== 4) return setError("Select each button label exactly once");
    clearError(); setIsLoading(true);
    try {
      const response = await solveTheScrew(round.id, bomb.id, currentModule.id, { holeColors, buttonLabels });
      const nextResult = response.output;
      const command = generateTwitchCommand({ moduleType: ModuleType.THE_SCREW, result: nextResult });
      setResult(nextResult); setCompletedStages(nextResult.stage); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { holeColors, buttonLabels, completedStages: nextResult.stage, result: nextResult, twitchCommand: command }, nextResult, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Screw"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, holeColors, buttonLabels, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const continueToNextStage = () => { setResult(null); setButtonLabels(Array(4).fill("")); setTwitchCommand(""); clearError(); };
  const setHole = (index: number, value: string) => setHoleColors((current) => current.map((item, i) => i === index ? value : item));
  const setButton = (index: number, value: string) => setButtonLabels((current) => current.map((item, i) => i === index ? value : item));
  const currentStage = Math.min(completedStages + 1, 3);

  return <SolverLayout>
    <SolverSection title="Stage progress" description={isSolved ? "All three stages complete." : result ? `Stage ${result.stage} solution ready.` : `Enter stage ${currentStage}.`}>
      <StageIndicator total={3} current={isSolved ? 4 : currentStage} completedThrough={completedStages} />
    </SolverSection>

    {!result && <>
      <SolverSection title="Hole colors" description="Enter the six outline colors in reading order. The layout stays fixed for all stages.">
        <div className="grid grid-cols-3 gap-3">
          {holeColors.map((color, index) => <PermutationSelect key={index} label={`Hole ${index + 1}`} value={color} values={COLORS} selected={holeColors} onChange={(value) => setHole(index, value)} disabled={isLoading || completedStages > 0} />)}
        </div>
      </SolverSection>
      <SolverSection title={`Stage ${currentStage} buttons`} description="Enter the labels from left to right.">
        <div className="grid grid-cols-4 gap-3">
          {buttonLabels.map((label, index) => <PermutationSelect key={index} label={`Position ${index + 1}`} value={label} values={LETTERS} selected={buttonLabels} onChange={(value) => setButton(index, value)} disabled={isLoading} />)}
        </div>
      </SolverSection>
      <SolverControls onSolve={solve} onReset={() => setButtonLabels(Array(4).fill(""))} showReset={false} isLoading={isLoading} isSolved={isSolved} solveText={`Solve stage ${currentStage}`} />
    </>}

    <ErrorAlert error={error} />
    {result && <SolverSection title={`Stage ${result.stage} solution`} className="border-emerald-500/40">
      <div className="flex flex-col items-center gap-3 text-center">
        <span aria-label={`${result.holeColor.toLowerCase()} hole`} className="h-16 w-16 rounded-full border-4 border-slate-700 shadow-inner" style={{ backgroundColor: COLOR_HEX[result.holeColor] }} />
        <p className="text-xl font-bold">Move the screw to hole {result.hole} ({result.holeColor.toLowerCase()})</p>
        <p className="text-lg">Then press button <strong>{result.buttonLabel}</strong> in position {result.buttonPosition}.</p>
        {!isSolved && <Button type="button" onClick={continueToNextStage}>Enter stage {result.stage + 1}</Button>}
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Remove the screw from its current hole, insert it into the shown hole, then press the shown button. Moving the screw to a wrong hole is safe until a button is pressed.</SolverInstructions>
  </SolverLayout>;
}
