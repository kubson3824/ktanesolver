import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import {
  solveVisualImpairment, type VisualImpairmentInput, type VisualImpairmentOutput,
} from "../../services/visualImpairmentService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const COLORS = ["Blue", "Green", "Red", "White"];
const emptyRows = () => Array(5).fill("") as string[];

type SavedState = {
  rows?: string[];
  desiredColor?: string;
  completedColors?: string[];
  desiredColors?: string[];
  result?: VisualImpairmentOutput | null;
};

export default function VisualImpairmentSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [rows, setRows] = useState(emptyRows);
  const [desiredColor, setDesiredColor] = useState("");
  const [completedColors, setCompletedColors] = useState<string[]>([]);
  const [result, setResult] = useState<VisualImpairmentOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo<SavedState>(
    () => ({ rows, desiredColor, completedColors, result }),
    [rows, desiredColor, completedColors, result],
  );

  useSolverModulePersistence<SavedState, VisualImpairmentOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (saved.rows?.length === 5) setRows(saved.rows);
      if (saved.desiredColor !== undefined) setDesiredColor(saved.desiredColor);
      setCompletedColors(saved.completedColors ?? saved.desiredColors ?? []);
      if (saved.result) setResult(saved.result);
    }, []),
    onRestoreSolution: useCallback((solution: VisualImpairmentOutput) => {
      const input = (solution as VisualImpairmentOutput & { input?: VisualImpairmentInput }).input;
      if (input?.stageComplete && !currentModule?.solved) return;
      if (input?.shades?.length === 25) {
        setRows(Array.from({ length: 5 }, (_, row) => input.shades.slice(row * 5, row * 5 + 5).join("")));
        setDesiredColor(input.desiredColor);
      }
      setResult(solution);
    }, [currentModule?.solved]),
    currentModule,
    setIsSolved,
  });

  const updateRow = (row: number, value: string) => {
    const clean = value.replace(/[^1-4]/g, "").slice(0, 5);
    setRows((current) => current.map((entry, index) => index === row ? clean : entry));
    setResult(null);
    clearError();
  };

  const submit = useCallback(async (stageComplete: boolean, moduleSolved: boolean) => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const input: VisualImpairmentInput = {
      shades: rows.join("").split("").map(Number), desiredColor, stageComplete, moduleSolved,
    };
    clearError(); setIsLoading(true);
    try {
      const response = await solveVisualImpairment(round.id, bomb.id, currentModule.id, input);
      const nextColors = stageComplete ? [...completedColors, desiredColor] : completedColors;
      const nextRows = stageComplete && !moduleSolved ? emptyRows() : rows;
      const nextColor = stageComplete && !moduleSolved ? "" : desiredColor;
      const nextResult = stageComplete && !moduleSolved ? null : response.output;
      setCompletedColors(nextColors); setRows(nextRows); setDesiredColor(nextColor);
      setResult(nextResult); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        rows: nextRows, desiredColor: nextColor, completedColors: nextColors,
        ...(stageComplete ? { desiredColors: nextColors } : {}), result: nextResult,
      }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Visual Impairment"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, rows, desiredColor, completedColors, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const resetStage = useCallback(() => {
    setRows(emptyRows()); setDesiredColor(""); setResult(null); resetSolverState();
  }, [resetSolverState]);

  const complete = rows.every((row) => /^[1-4]{5}$/.test(row)) && Boolean(desiredColor);
  const stage = completedColors.length + 1;
  const pressed = new Set(result?.positions ?? []);
  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.VISUAL_IMPAIRMENT, result }) : "";

  return <SolverLayout>
    <SolverSection title={`Stage ${stage}`} description="Assign digits 1–4 to the four gray shades in any order, then use the same digit for every matching shade.">
      <div className="mx-auto grid max-w-xs gap-2">
        {rows.map((row, index) => <label key={index} className="grid grid-cols-[4rem_1fr] items-center gap-2 text-sm font-medium">
          Row {index + 1}
          <Input value={row} onChange={(event) => updateRow(index, event.target.value)} disabled={isLoading || isSolved || Boolean(result)}
            inputMode="numeric" pattern="[1-4]{5}" maxLength={5} placeholder="12341" aria-label={`Row ${index + 1} shades`} className="font-mono tracking-[0.45em]" />
        </label>)}
      </div>
    </SolverSection>
    <SolverSection title="Indicator color">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {COLORS.map((color) => <Button key={color} type="button" variant={desiredColor === color ? "default" : "outline"}
          disabled={isLoading || isSolved || Boolean(result)} onClick={() => { setDesiredColor(color); setResult(null); clearError(); }}
          aria-pressed={desiredColor === color}>{color}</Button>)}
      </div>
    </SolverSection>
    {!result && <SolverControls onSolve={() => submit(false, false)} onReset={resetStage} isLoading={isLoading} isSolved={isSolved}
      isSolveDisabled={!complete} solveText="Find squares" />}
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press these squares" className="border-emerald-500/40">
      <div className="mx-auto grid max-w-xs grid-cols-5 gap-1" role="grid" aria-label="Visual Impairment solution">
        {Array.from({ length: 25 }, (_, index) => {
          const coordinate = `${String.fromCharCode(65 + index % 5)}${Math.floor(index / 5) + 1}`;
          const active = pressed.has(coordinate);
          return <div key={coordinate} role="gridcell" aria-label={`${coordinate} ${active ? "press" : "leave"}`} className={cn(
            "flex aspect-square items-center justify-center rounded border text-xs font-semibold",
            active ? "border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300" : "border-border text-muted-foreground",
          )}>{coordinate}</div>;
        })}
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">Picture {result.pictureNumber} · {result.positions.join(" ")}</p>
      {!isSolved && <div className="mt-4 flex flex-wrap justify-center gap-2">
        {stage < 3 && <Button type="button" disabled={isLoading} onClick={() => submit(true, false)}>Stage completed — next stage</Button>}
        {stage >= 2 && <Button type="button" disabled={isLoading} onClick={() => submit(true, true)}>Module solved</Button>}
        <Button type="button" variant="outline" disabled={isLoading} onClick={resetStage}>Stage struck — reset</Button>
      </div>}
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Press every highlighted square in any order. Afterward, confirm whether the module advanced or solved; a strike resets only the current stage.</SolverInstructions>
  </SolverLayout>;
}
