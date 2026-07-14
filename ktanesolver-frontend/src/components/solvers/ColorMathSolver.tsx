import { useCallback, useMemo, useState } from "react";
import { solveColorMath, type ColorMathInput, type ColorMathOutput } from "../../services/colorMathService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";
import { cn } from "../../lib/cn";

const COLORS = [
  { name: "BLUE", className: "bg-blue-600" },
  { name: "GREEN", className: "bg-green-600" },
  { name: "PURPLE", className: "bg-purple-600" },
  { name: "YELLOW", className: "bg-yellow-400" },
  { name: "WHITE", className: "bg-white" },
  { name: "MAGENTA", className: "bg-fuchsia-500" },
  { name: "RED", className: "bg-red-600" },
  { name: "ORANGE", className: "bg-orange-500" },
  { name: "GRAY", className: "bg-gray-500" },
  { name: "BLACK", className: "bg-black" },
] as const;
const EMPTY_COLORS = ["", "", "", ""];
const SYMBOLS: Record<string, string> = { A: "+", S: "−", M: "×", D: "÷" };

interface ColorMathSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function ColorMathSolver({ bomb }: ColorMathSolverProps) {
  const [leftColors, setLeftColors] = useState<string[]>(EMPTY_COLORS);
  const [rightColors, setRightColors] = useState<string[]>(EMPTY_COLORS);
  const [displayColor, setDisplayColor] = useState("GREEN");
  const [operation, setOperation] = useState("");
  const [result, setResult] = useState<ColorMathOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ leftColors, rightColors, displayColor, operation, result, twitchCommand }),
    [leftColors, rightColors, displayColor, operation, result, twitchCommand],
  );

  const onRestoreState = useCallback((state: Partial<typeof moduleState> & { input?: Partial<ColorMathInput> }) => {
    const input = state.input ?? state;
    if (input.leftColors?.length === 4) setLeftColors(input.leftColors);
    if (input.rightColors?.length === 4) setRightColors(input.rightColors);
    if (input.displayColor) setDisplayColor(input.displayColor);
    if (input.operation) setOperation(input.operation);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: ColorMathOutput) => {
    if (!solution) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.COLOR_MATH, result: solution }));
  }, []);

  useSolverModulePersistence<typeof moduleState, ColorMathOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as ColorMathOutput & { output?: ColorMathOutput };
      return value.output ?? value;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const setLed = useCallback((side: "left" | "right", index: number, color: string) => {
    const setter = side === "left" ? setLeftColors : setRightColors;
    setter((current) => current.map((value, position) => position === index ? color : value));
    clearError();
  }, [clearError]);

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!leftColors.every(Boolean) || !operation || (displayColor === "GREEN" && !rightColors.every(Boolean))) {
      return setError("Select the display, operation, and all required LED colors");
    }
    clearError();
    setIsLoading(true);
    try {
      const input = { leftColors, rightColors: displayColor === "GREEN" ? rightColors : [], displayColor, operation };
      const response = await solveColorMath(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.COLOR_MATH, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Color Math");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, leftColors, rightColors, displayColor, operation, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setLeftColors(EMPTY_COLORS);
    setRightColors(EMPTY_COLORS);
    setDisplayColor("GREEN");
    setOperation("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  const ledSelectors = (side: "left" | "right", values: string[]) => (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {values.map((value, index) => (
        <label key={index} className="grid gap-1 text-sm font-medium">
          LED {index + 1} {index === 0 ? "(top)" : index === 3 ? "(bottom)" : ""}
          <select
            value={value}
            onChange={(event) => setLed(side, index, event.target.value)}
            disabled={isLoading || isSolved}
            className="rounded-md border bg-background px-3 py-2"
          >
            <option value="">Select color</option>
            {COLORS.map((color) => <option key={color.name} value={color.name}>{color.name}</option>)}
          </select>
        </label>
      ))}
    </div>
  );

  return (
    <SolverLayout>
      <SolverSection title="Display" description="Choose the letter and its text color.">
        <div className="grid gap-3 sm:grid-cols-2">
          <fieldset className="grid grid-cols-4 gap-2">
            <legend className="mb-2 text-sm font-medium">Operation</legend>
            {Object.entries(SYMBOLS).map(([value, symbol]) => (
              <label key={value} className={cn("cursor-pointer rounded-md border p-3 text-center", operation === value && "border-primary bg-primary/5")}>
                <input className="sr-only" type="radio" name="operation" value={value} checked={operation === value} onChange={() => { setOperation(value); clearError(); }} disabled={isLoading || isSolved} />
                <span className="text-xl font-semibold">{value}</span><span className="ml-1 text-muted-foreground">{symbol}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="mb-2 text-sm font-medium">Text color</legend>
            {["GREEN", "RED"].map((value) => (
              <label key={value} className={cn("flex cursor-pointer items-center justify-center gap-2 rounded-md border p-3", displayColor === value && "border-primary bg-primary/5")}>
                <input type="radio" name="displayColor" value={value} checked={displayColor === value} onChange={() => { setDisplayColor(value); clearError(); }} disabled={isLoading || isSolved} />
                <span className={cn("h-4 w-4 rounded-full", value === "GREEN" ? "bg-green-600" : "bg-red-600")} aria-hidden />
                {value}
              </label>
            ))}
          </fieldset>
        </div>
      </SolverSection>

      <SolverSection title="Left LEDs" description="Enter colors from top (most significant digit) to bottom.">
        {ledSelectors("left", leftColors)}
      </SolverSection>

      {displayColor === "GREEN" && (
        <SolverSection title="Right LEDs" description="Enter colors from top to bottom. Red displays ignore this bank.">
          {ledSelectors("right", rightColors)}
        </SolverSection>
      )}

      <SolverControls
        onSolve={solve}
        onReset={reset}
        isSolveDisabled={!operation || !leftColors.every(Boolean) || (displayColor === "GREEN" && !rightColors.every(Boolean))}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Calculate colors"
      />
      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Set the right LEDs" className="border-emerald-500/40">
          <p className="mb-4 text-center font-mono text-lg">
            {result.baseNumber} {SYMBOLS[operation]} {result.operand} = {String(result.answer).padStart(4, "0")}
          </p>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {result.colors.map((color, index) => {
              const swatch = COLORS.find((option) => option.name === color);
              return (
                <li key={index} className="rounded-md border bg-emerald-500/10 p-3 text-center">
                  <span className={cn("mx-auto mb-2 block h-10 w-10 rounded-full border border-black/40", swatch?.className)} aria-hidden />
                  <span className="font-medium">{index + 1}. {color}</span>
                </li>
              );
            })}
          </ol>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>Set the four right LEDs to the shown colors from top to bottom, then press SUBMIT. For a red display, bomb edgework supplies the operand automatically.</SolverInstructions>
    </SolverLayout>
  );
}
