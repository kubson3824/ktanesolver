import { useCallback, useMemo, useState } from "react";
import {
  solveGraffitiNumbers,
  type GraffitiNumberColor,
  type GraffitiNumbersOutput,
} from "../../services/graffitiNumbersService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const NUMBER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const COLORS: GraffitiNumberColor[] = ["RED", "GREEN", "BLUE", "YELLOW"];
const COLOR_STYLES: Record<GraffitiNumberColor, string> = {
  RED: "#dc2626", GREEN: "#16a34a", BLUE: "#2563eb", YELLOW: "#eab308",
};
const EMPTY_NUMBERS: Array<number | ""> = Array(9).fill("");
const EMPTY_COLORS: Array<GraffitiNumberColor | ""> = Array(9).fill("");

export default function GraffitiNumbersSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [numbers, setNumbers] = useState(EMPTY_NUMBERS);
  const [colors, setColors] = useState(EMPTY_COLORS);
  const [result, setResult] = useState<GraffitiNumbersOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ numbers, colors, result, twitchCommand }),
    [numbers, colors, result, twitchCommand],
  );

  useSolverModulePersistence<typeof moduleState, GraffitiNumbersOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.numbers?.length === 9) setNumbers(state.numbers);
      if (state.colors?.length === 9) setColors(state.colors);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      if (!solution?.pressNumbers?.length) return;
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.GRAFFITI_NUMBERS, result: solution }));
    },
    currentModule,
    setIsSolved,
  });

  const changeNumber = (index: number, value: string) => {
    setNumbers((current) => current.map((number, position) => position === index ? Number(value) || "" : number));
    setResult(null); setTwitchCommand(""); clearError();
  };

  const changeColor = (index: number, color: GraffitiNumberColor | "") => {
    setColors((current) => current.map((value, position) => position === index ? color : value));
    setResult(null); setTwitchCommand(""); clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const selectedNumbers = numbers.filter((number): number is number => typeof number === "number");
    const selectedColors = colors.filter((color): color is GraffitiNumberColor => Boolean(color));
    if (selectedNumbers.length !== 9 || selectedColors.length !== 9) return setError("Complete all 9 buttons");
    if (new Set(selectedNumbers).size !== 9) return setError("Use each number from 1 to 9 exactly once");
    clearError(); setIsLoading(true);
    try {
      const response = await solveGraffitiNumbers(
        round.id, bomb.id, currentModule.id, selectedNumbers, selectedColors,
      );
      const command = generateTwitchCommand({
        moduleType: ModuleType.GRAFFITI_NUMBERS,
        result: response.output,
      });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id,
        { numbers: selectedNumbers, colors: selectedColors, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Graffiti Numbers");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, numbers, colors, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setNumbers(EMPTY_NUMBERS); setColors(EMPTY_COLORS); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Painted number grid" description="Enter the 3×3 wall in reading order.">
      <div className="mx-auto grid max-w-lg grid-cols-3 gap-3">
        {numbers.map((number, index) => <div key={index} className="rounded-lg border border-border p-2">
          <span className="mb-2 block text-xs font-medium text-muted-foreground">Position {index + 1}</span>
          <label className="block text-xs font-medium">
            Number
            <select
              value={number}
              onChange={(event) => changeNumber(index, event.target.value)}
              disabled={isLoading || isSolved}
              aria-label={`Position ${index + 1} number`}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2"
            >
              <option value="">Select…</option>
              {NUMBER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="mt-2 block text-xs font-medium">
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded-full border border-black/30"
                style={{ backgroundColor: colors[index] ? COLOR_STYLES[colors[index]] : "transparent" }}
              />
              Color
            </span>
            <select
              value={colors[index]}
              onChange={(event) => changeColor(index, event.target.value as GraffitiNumberColor | "")}
              disabled={isLoading || isSolved}
              aria-label={`Position ${index + 1} color`}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2"
            >
              <option value="">Select…</option>
              {COLORS.map((color) => <option key={color} value={color}>
                {color[0] + color.slice(1).toLowerCase()}
              </option>)}
            </select>
          </label>
        </div>)}
      </div>
    </SolverSection>
    <SolverControls
      onSolve={solve}
      onReset={reset}
      isLoading={isLoading}
      isSolved={isSolved}
      isSolveDisabled={numbers.some((number) => !number) || colors.some((color) => !color)}
      solveText="Find spray order"
    />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Spray these numbers" className="border-emerald-500/40">
      <div className="flex flex-wrap justify-center gap-3">
        {result.pressNumbers.map((number, index) => <div
          key={number}
          className="flex h-14 w-14 flex-col items-center justify-center rounded-lg border-2 border-emerald-500 bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-300"
        >
          <span className="text-xl">{number}</span>
          <span className="text-[10px] font-normal">position {result.buttonPositions[index]}</span>
        </div>)}
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Positions run left to right, top to bottom. Spray the displayed rule numbers in the shown order.</SolverInstructions>
  </SolverLayout>;
}
