import { useCallback, useState } from "react";
import {
  SYMBOLIC_COORDINATE_COLORS,
  SYMBOLIC_COORDINATE_SYMBOL_LABELS,
  SYMBOLIC_COORDINATE_SYMBOLS,
  solveSymbolicCoordinates,
  type SymbolicCoordinateColor,
  type SymbolicCoordinateSymbol,
  type SymbolicCoordinatesOutput,
} from "../../services/symbolicCoordinatesService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { cn } from "../../lib/cn";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, StageIndicator, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";
import { Button } from "../ui";
import { SymbolicCoordinateGlyph } from "./SymbolicCoordinateGlyph";

const POSITIONS = ["Left", "Middle", "Right"];
const LED_POSITIONS = ["Top", "Bottom left", "Bottom right"];
const COLOR_STYLES: Record<SymbolicCoordinateColor, string> = {
  AQUA: "bg-cyan-400 border-cyan-600",
  GREEN: "bg-green-500 border-green-700",
  PURPLE: "bg-purple-500 border-purple-700",
  YELLOW: "bg-yellow-300 border-yellow-500",
};
type SelectedSymbol = SymbolicCoordinateSymbol | "";
type SelectedColor = SymbolicCoordinateColor | "";
interface SavedState {
  stageSymbols: SymbolicCoordinateSymbol[][];
  pendingSymbols?: SelectedSymbol[];
  pendingLedColors?: SelectedColor[];
}

export default function SymbolicCoordinatesSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [symbols, setSymbols] = useState<SelectedSymbol[]>(["", "", ""]);
  const [ledColors, setLedColors] = useState<SelectedColor[]>(["", "", ""]);
  const [stageSymbols, setStageSymbols] = useState<SymbolicCoordinateSymbol[][]>([]);
  const [result, setResult] = useState<SymbolicCoordinatesOutput | null>(null);
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const savedState = { stageSymbols, pendingSymbols: symbols, pendingLedColors: ledColors };
  const currentStage = stageSymbols.length + 1;
  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.SYMBOLIC_COORDINATES, result }) : "";

  useSolverModulePersistence<SavedState, SymbolicCoordinatesOutput>({
    state: savedState,
    onRestoreState: useCallback((saved) => {
      if (Array.isArray(saved.stageSymbols)) setStageSymbols(saved.stageSymbols);
      if (saved.pendingSymbols?.length === 3) setSymbols(saved.pendingSymbols);
      if (saved.pendingLedColors?.length === 3) setLedColors(saved.pendingLedColors);
    }, []),
    onRestoreSolution: useCallback((solution: SymbolicCoordinatesOutput) => setResult(solution.confirmed ? null : solution), []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const calculate = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (symbols.some((symbol) => !symbol) || ledColors.some((color) => !color)) return setError("Select all three symbols and LED colors");
    clearError(); setIsLoading(true);
    try {
      const stageInput = {
        symbols: symbols as SymbolicCoordinateSymbol[],
        ledColors: ledColors as SymbolicCoordinateColor[],
        confirmStage: false,
      };
      const response = await solveSymbolicCoordinates(round.id, bomb.id, currentModule.id, stageInput);
      setResult(response.output);
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        stageSymbols,
        pendingSymbols: stageInput.symbols,
        pendingLedColors: stageInput.ledColors,
      }, response.output, false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Symbolic Coordinates"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, symbols, ledColors, stageSymbols, clearError, setError, setIsLoading, updateModuleAfterSolve]);

  const confirm = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id || symbols.some((symbol) => !symbol) || ledColors.some((color) => !color)) {
      return setError("Missing the pending stage display");
    }
    clearError(); setIsLoading(true);
    try {
      const stageInput = {
        symbols: symbols as SymbolicCoordinateSymbol[],
        ledColors: ledColors as SymbolicCoordinateColor[],
        confirmStage: true,
      };
      const response = await solveSymbolicCoordinates(round.id, bomb.id, currentModule.id, stageInput);
      const nextSymbols = [...stageSymbols, stageInput.symbols];
      setStageSymbols(nextSymbols); setResult(null); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      else { setSymbols(["", "", ""]); setLedColors(["", "", ""]); }
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        stageSymbols: nextSymbols,
        pendingSymbols: [],
        pendingLedColors: [],
      }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to confirm Symbolic Coordinates stage"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, symbols, ledColors, stageSymbols, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  return <SolverLayout>
    <SolverSection title="Stage progress" description={isSolved ? "All three coordinates submitted." : `Stage ${currentStage} of 3`}>
      <StageIndicator total={3} current={isSolved ? 4 : currentStage} completedThrough={stageSymbols.length} />
    </SolverSection>

    {!isSolved && !result && <>
      <SolverSection title="Symbols" description="Choose the displayed symbols from left to right.">
        <div className="grid gap-3 sm:grid-cols-3">
          {POSITIONS.map((position, index) => <fieldset key={position} className="rounded-md border p-2">
            <legend className="px-1 text-xs font-medium text-muted-foreground">{position}</legend>
            <div className="grid grid-cols-5 gap-1">
              {SYMBOLIC_COORDINATE_SYMBOLS.map((symbol) => <button
                key={symbol} type="button" aria-label={`${position} ${SYMBOLIC_COORDINATE_SYMBOL_LABELS[symbol]} symbol`}
                aria-pressed={symbols[index] === symbol} disabled={isLoading}
                onClick={() => { setSymbols((current) => current.map((value, symbolIndex) => symbolIndex === index ? symbol : value)); clearError(); }}
                className={cn("rounded border p-1 text-foreground", symbols[index] === symbol ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "border-border")}
              ><SymbolicCoordinateGlyph symbol={symbol} className="aspect-square w-full" /></button>)}
            </div>
          </fieldset>)}
        </div>
      </SolverSection>

      <SolverSection title="LEDs" description="Choose the top LED, then the bottom-left and bottom-right LEDs.">
        <div className="grid gap-3 sm:grid-cols-3">
          {POSITIONS.map((_, index) => <fieldset key={index} className="rounded-md border p-2">
            <legend className="px-1 text-xs font-medium text-muted-foreground">{LED_POSITIONS[index]}</legend>
            <div className="grid grid-cols-4 gap-2">
              {SYMBOLIC_COORDINATE_COLORS.map((color) => <button
                key={color} type="button" aria-label={`${LED_POSITIONS[index]} ${color.toLowerCase()} LED`}
                aria-pressed={ledColors[index] === color} disabled={isLoading}
                onClick={() => { setLedColors((current) => current.map((value, colorIndex) => colorIndex === index ? color : value)); clearError(); }}
                className={cn("aspect-square rounded-full border-2", COLOR_STYLES[color], ledColors[index] === color ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "opacity-55 hover:opacity-100")}
              />)}
            </div>
          </fieldset>)}
        </div>
      </SolverSection>
    </>}

    {!result && <SolverControls onSolve={calculate} onReset={() => { setSymbols(["", "", ""]); setLedColors(["", "", ""]); clearError(); }} isSolveDisabled={symbols.some((symbol) => !symbol) || ledColors.some((color) => !color)} isLoading={isLoading} isSolved={isSolved} solveText={`Solve stage ${currentStage}`} showReset={false} />}
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Stage ${result.stage} coordinate`} className="border-emerald-500/40">
      <div className="rounded-md border-2 border-emerald-500 bg-emerald-500/15 p-4 text-center font-mono text-4xl font-bold text-emerald-700 dark:text-emerald-300">{result.coordinate}</div>
      {!isSolved && <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button type="button" onClick={confirm} disabled={isLoading}>The module advanced</Button>
        <Button type="button" variant="outline" onClick={() => setResult(null)} disabled={isLoading}>Edit the display</Button>
      </div>}
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Submit the shown coordinate, then confirm only after the module advances. A strike leaves the display and stage unchanged, so retry the same coordinate; use Edit only if the display was entered incorrectly.</SolverInstructions>
  </SolverLayout>;
}
