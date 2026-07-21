import { useCallback, useMemo, useState } from "react";
import { solveLedGrid, type LedGridColor, type LedGridOutput } from "../../services/ledGridService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const COLORS: LedGridColor[] = ["RED", "BLUE", "YELLOW", "GREEN", "ORANGE", "PINK", "PURPLE", "WHITE", "UNLIT"];
const COLOR_STYLES: Record<LedGridColor, string> = {
  RED: "#dc2626", BLUE: "#2563eb", YELLOW: "#eab308", GREEN: "#16a34a", ORANGE: "#f97316",
  PINK: "#ec4899", PURPLE: "#9333ea", WHITE: "#f8fafc", UNLIT: "#111827",
};
const EMPTY_GRID: Array<LedGridColor | ""> = Array(9).fill("");

export default function LedGridSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [colors, setColors] = useState(EMPTY_GRID);
  const [result, setResult] = useState<LedGridOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ colors, result, twitchCommand }), [colors, result, twitchCommand]);

  useSolverModulePersistence<typeof moduleState, LedGridOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.colors?.length === 9) setColors(state.colors);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      if (!solution?.pressOrder?.length) return;
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.LED_GRID, result: solution }));
    },
    currentModule,
    setIsSolved,
  });

  const changeColor = (index: number, color: LedGridColor | "") => {
    setColors((current) => current.map((value, position) => position === index ? color : value));
    setResult(null); setTwitchCommand(""); clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const selected = colors.filter((color): color is LedGridColor => Boolean(color));
    if (selected.length !== 9) return setError("Select a color for all 9 LEDs");
    clearError(); setIsLoading(true);
    try {
      const response = await solveLedGrid(round.id, bomb.id, currentModule.id, selected);
      const command = generateTwitchCommand({ moduleType: ModuleType.LED_GRID, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id,
        { colors: selected, unlitCount: response.output.unlitCount, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve LED Grid"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, colors, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setColors(EMPTY_GRID); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="LED colors" description="Enter the 3×3 grid in reading order. Unlit LEDs count as a color in pair rules.">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-3">
        {colors.map((color, index) => <label key={index} className="rounded-lg border border-border p-2 text-xs font-medium">
          <span className="mb-2 flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border border-black/30" style={{ backgroundColor: color ? COLOR_STYLES[color] : "transparent" }} />
            LED {index + 1}
          </span>
          <select
            value={color}
            onChange={(event) => changeColor(index, event.target.value as LedGridColor | "")}
            disabled={isLoading || isSolved}
            aria-label={`LED ${index + 1} color`}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="">Select…</option>
            {COLORS.map((option) => <option key={option} value={option}>{option === "UNLIT" ? "Unlit" : option[0] + option.slice(1).toLowerCase()}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={colors.some((color) => !color)} solveText="Find sequence" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press in this order" className="border-emerald-500/40">
      <div className="flex justify-center gap-3">
        {result.pressOrder.map((button, index) => <div key={button} className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-emerald-500 bg-emerald-500/15 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
          <span className="sr-only">{index + 1}: </span>{button}
        </div>)}
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">{result.unlitCount} unlit LED{result.unlitCount === 1 ? "" : "s"}</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Rows run left to right, top to bottom. A pair means exactly two LEDs of one color, including unlit.</SolverInstructions>
  </SolverLayout>;
}
