import { useCallback, useMemo, useState } from "react";
import {
  solveBlindMaze,
  type BlindMazeColor,
  type BlindMazeDirection,
  type BlindMazeInput,
  type BlindMazeOutput,
} from "../../services/blindMazeService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const DIRECTIONS = ["north", "east", "south", "west"] as const;
const COLORS: BlindMazeColor[] = ["RED", "GREEN", "BLUE", "GRAY", "YELLOW"];
const ARROWS: Record<BlindMazeDirection, string> = { NORTH: "↑", EAST: "→", SOUTH: "↓", WEST: "←" };
type ColorSelection = Record<(typeof DIRECTIONS)[number], BlindMazeColor | "">;

const emptyColors = (): ColorSelection => ({ north: "", east: "", south: "", west: "" });
const title = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

export default function BlindMazeSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [colors, setColors] = useState<ColorSelection>(emptyColors);
  const [result, setResult] = useState<BlindMazeOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ colors, result }), [colors, result]);

  useSolverModulePersistence<typeof moduleState, BlindMazeOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.colors) setColors(state.colors);
      if (state.result !== undefined) setResult(state.result);
    },
    onRestoreSolution: (solution) => { if (solution?.moves) setResult(solution); },
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (DIRECTIONS.some((direction) => !colors[direction])) return setError("Select all four button colors");
    clearError(); setIsLoading(true);
    try {
      const input = colors as BlindMazeInput;
      const response = await solveBlindMaze(round.id, bomb.id, currentModule.id, input);
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        colors,
        result: response.output,
        buttonColors: Object.fromEntries(DIRECTIONS.map((direction) => [direction, title(colors[direction])])),
      }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Blind Maze"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, colors, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => { setColors(emptyColors()); setResult(null); resetSolverState(); }, [resetSolverState]);
  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.BLIND_MAZE, result }) : "";

  return <SolverLayout>
    <SolverSection title="Button colors" description="Select the color shown on each direction button.">
      <div className="grid gap-3 sm:grid-cols-2">
        {DIRECTIONS.map((direction) => <label key={direction} className="text-sm font-medium capitalize">
          {direction}
          <select
            value={colors[direction]}
            onChange={(event) => setColors((current) => ({ ...current, [direction]: event.target.value as BlindMazeColor }))}
            disabled={isLoading || isSolved}
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select color…</option>
            {COLORS.map((color) => <option key={color} value={color}>{title(color)}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={DIRECTIONS.some((direction) => !colors[direction])} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Route to the exit" description={`Maze ${result.mazeNumber}, ${result.rotation} (rule ${result.rotationRule}); start at row ${result.startRow}, column ${result.startColumn}.`} className="border-emerald-500/40">
      <ol className="flex flex-wrap justify-center gap-2" aria-label="Button sequence">
        {result.moves.map((move, index) => <li key={index} className="flex h-12 w-12 items-center justify-center rounded-md border border-emerald-500/50 bg-emerald-500/10 text-2xl font-bold" aria-label={`${index + 1}: ${title(move)}`}>{ARROWS[move]}</li>)}
      </ol>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Press the direction buttons in order. The final press moves through the north exit.</SolverInstructions>
  </SolverLayout>;
}
