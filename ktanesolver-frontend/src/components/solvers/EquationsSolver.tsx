import { useCallback, useMemo, useState } from "react";
import {
  EQUATION_COLORS, solveEquations, type EquationColor, type EquationsInput, type EquationsOutput,
} from "../../services/equationsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

type SavedState = Partial<EquationsInput> & { input?: Partial<EquationsInput>; result?: EquationsOutput | null; twitchCommand?: string };

export default function EquationsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [keyColors, setKeyColors] = useState<EquationColor[]>(Array(10).fill("BLUE"));
  const [leds, setLeds] = useState<boolean[]>([false, false, false]);
  const [result, setResult] = useState<EquationsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ keyColors, leds, result, twitchCommand }), [keyColors, leds, result, twitchCommand]);

  useSolverModulePersistence<SavedState, EquationsOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      const input = saved.input ?? saved;
      if (input.keyColors?.length === 10) setKeyColors(input.keyColors);
      if (input.leds?.length === 3) setLeds(input.leds);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: EquationsOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.EQUATIONS, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const clearResult = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const changeColor = (index: number, color: EquationColor) => {
    setKeyColors((current) => current.map((value, position) => position === index ? color : value)); clearResult();
  };
  const toggleLed = (index: number) => {
    setLeds((current) => current.map((value, position) => position === index ? !value : value)); clearResult();
  };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const input: EquationsInput = { keyColors, leds };
    clearError(); setIsLoading(true);
    try {
      const response = await solveEquations(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.EQUATIONS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Equations"); }
    finally { setIsLoading(false); }
  };
  const reset = () => {
    setKeyColors(Array(10).fill("BLUE")); setLeds([false, false, false]);
    setResult(null); setTwitchCommand(""); resetSolverState();
  };

  return <SolverLayout>
    <SolverSection title="Digit key colors" description="Enter the color of each key from 0 through 9.">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {keyColors.map((color, index) => <label key={index} className="text-sm font-medium">Key {index}
          <select aria-label={`Key ${index} color`} value={color} onChange={(event) => changeColor(index, event.target.value as EquationColor)} disabled={isLoading || isSolved} className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-2">
            {EQUATION_COLORS.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>
    <SolverSection title="LEDs" description="Mark each of the three LEDs that is lit.">
      <div className="flex flex-wrap gap-4">
        {leds.map((lit, index) => <label key={index} className="flex items-center gap-2 text-sm font-medium">
          <input aria-label={`LED ${index + 1} lit`} type="checkbox" checked={lit} onChange={() => toggleLed(index)} disabled={isLoading || isSolved} />
          LED {index + 1} lit
        </label>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Solve equations" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Submission" className="border-emerald-500/40">
      <p className="text-center text-4xl font-bold">{result.blank ? "Submit blank" : result.answer}</p>
      <p className="mt-2 text-center text-sm text-muted-foreground">System {result.system}, submit {result.variable}; a={result.a}, b={result.b}, c={result.c}, d={result.d}</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Enter the displayed number and press equals. If instructed to submit blank, clear the screen and press equals without entering a value.</SolverInstructions>
  </SolverLayout>;
}
