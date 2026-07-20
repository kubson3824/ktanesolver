import { useCallback, useMemo, useState } from "react";
import { solveColorMorse, type ColorMorseInput, type ColorMorseOutput } from "../../services/colorMorseService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const COLORS = ["RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "PURPLE", "WHITE"];
const CHARACTERS = [..."0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
const OPERATORS = [
  ["ADD", "+"], ["SUBTRACT", "−"], ["MULTIPLY", "×"], ["DIVIDE", "÷"],
] as const;

export default function ColorMorseSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [characters, setCharacters] = useState(["", "", ""]);
  const [colors, setColors] = useState(["", "", ""]);
  const [operators, setOperators] = useState(["", ""]);
  const [parentheses, setParentheses] = useState("FIRST_TWO");
  const [result, setResult] = useState<ColorMorseOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ characters, colors, operators, parentheses, result, twitchCommand }),
    [characters, colors, operators, parentheses, result, twitchCommand],
  );

  const onRestoreState = useCallback((state: Partial<typeof moduleState> & { input?: Partial<ColorMorseInput> }) => {
    const input = state.input ?? state;
    if (input.characters?.length === 3) setCharacters(input.characters);
    if (input.colors?.length === 3) setColors(input.colors);
    if (input.operators?.length === 2) setOperators(input.operators);
    if (input.parentheses) setParentheses(input.parentheses);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: ColorMorseOutput) => {
    if (!solution) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.COLOR_MORSE, result: solution }));
  }, []);

  useSolverModulePersistence<typeof moduleState, ColorMorseOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as ColorMorseOutput & { output?: ColorMorseOutput };
      return value.output ?? value;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const setLight = useCallback((field: "character" | "color", index: number, value: string) => {
    const setter = field === "character" ? setCharacters : setColors;
    setter((current) => current.map((item, position) => position === index ? value : item));
    clearError();
  }, [clearError]);

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (![...characters, ...colors, ...operators].every(Boolean)) return setError("Complete all three lights and both operators");
    clearError();
    setIsLoading(true);
    try {
      const input = { characters, colors, operators, parentheses };
      const response = await solveColorMorse(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.COLOR_MORSE, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Color Morse");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, characters, colors, operators, parentheses, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setCharacters(["", "", ""]);
    setColors(["", "", ""]);
    setOperators(["", ""]);
    setParentheses("FIRST_TWO");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Flashing lights" description="Decode each light’s Morse character, then choose its color from left to right.">
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((index) => <fieldset key={index} className="grid gap-2 rounded-md border p-3">
          <legend className="px-1 font-medium">Light {index + 1}</legend>
          <label className="grid gap-1 text-sm">Character
            <select aria-label={`Light ${index + 1} character`} value={characters[index]} onChange={(event) => setLight("character", index, event.target.value)} disabled={isLoading || isSolved} className="rounded-md border bg-background px-3 py-2">
              <option value="">Select</option>
              {CHARACTERS.map((character) => <option key={character}>{character}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">Color
            <select aria-label={`Light ${index + 1} color`} value={colors[index]} onChange={(event) => setLight("color", index, event.target.value)} disabled={isLoading || isSolved} className="rounded-md border bg-background px-3 py-2">
              <option value="">Select</option>
              {COLORS.map((color) => <option key={color}>{color}</option>)}
            </select>
          </label>
        </fieldset>)}
      </div>
    </SolverSection>

    <SolverSection title="Expression">
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((index) => <label key={index} className="grid gap-1 text-sm font-medium">Operator {index + 1}
          <select value={operators[index]} onChange={(event) => { setOperators((current) => current.map((item, position) => position === index ? event.target.value : item)); clearError(); }} disabled={isLoading || isSolved} className="rounded-md border bg-background px-3 py-2">
            <option value="">Select</option>
            {OPERATORS.map(([value, symbol]) => <option key={value} value={value}>{symbol}</option>)}
          </select>
        </label>)}
      </div>
      <fieldset className="mt-3 flex flex-wrap gap-4">
        <legend className="mb-1 text-sm font-medium">Displayed parentheses</legend>
        {[["FIRST_TWO", "(1 op 2) op 3"], ["LAST_TWO", "1 op (2 op 3)"]].map(([value, label]) => <label key={value} className="flex items-center gap-2">
          <input type="radio" name="parentheses" value={value} checked={parentheses === value} onChange={() => { setParentheses(value); clearError(); }} disabled={isLoading || isSolved} />
          {label}
        </label>)}
      </fieldset>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={![...characters, ...colors, ...operators].every(Boolean)} isLoading={isLoading} isSolved={isSolved} solveText="Calculate transmission" />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Transmit" className="border-emerald-500/40">
      <p className="text-center text-lg"><span className="font-mono">{result.evaluatedExpression}</span> = <strong>{result.answer}</strong></p>
      <p className="mt-3 text-center font-mono text-2xl tracking-wider">{result.morse.join("   ")}</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Default rule seed only. Press dot and dash for each Morse group, pressing the blank button after every group. A leading − uses the Morse hyphen <span className="font-mono">-....-</span>.</SolverInstructions>
  </SolverLayout>;
}
