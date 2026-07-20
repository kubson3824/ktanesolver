import { useState } from "react";
import {
  solveGameOfLife, type GameOfLifeCell, type GameOfLifeColor, type GameOfLifeOutput,
} from "../../services/gameOfLifeService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Button } from "../ui/button";

const COLORS: GameOfLifeColor[] = ["BLACK", "WHITE", "RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "PURPLE", "BROWN"];
const CSS_COLORS: Record<GameOfLifeColor, string> = {
  BLACK: "#111827", WHITE: "#f9fafb", RED: "#dc2626", ORANGE: "#f97316", YELLOW: "#facc15",
  GREEN: "#16a34a", BLUE: "#2563eb", PURPLE: "#9333ea", BROWN: "#92400e",
};
const emptyGrid = (): GameOfLifeCell[] => Array.from({ length: 48 }, () => ({ first: "BLACK", second: "BLACK" }));
const coordinate = (index: number) => `${String.fromCharCode(65 + index % 6)}${Math.floor(index / 6) + 1}`;
const label = (color: GameOfLifeColor) => color[0] + color.slice(1).toLowerCase();
const background = (cell: GameOfLifeCell) => cell.first === cell.second
  ? CSS_COLORS[cell.first]
  : `linear-gradient(135deg, ${CSS_COLORS[cell.first]} 50%, ${CSS_COLORS[cell.second]} 50%)`;

type PersistedState = {
  cells: GameOfLifeCell[];
  timerBelowHalf: boolean;
  result: GameOfLifeOutput | null;
};

function GameOfLifeSolver({ bomb, cruel }: { bomb: BombEntity | null | undefined; cruel: boolean }) {
  const [cells, setCells] = useState(emptyGrid);
  const [first, setFirst] = useState<GameOfLifeColor>("BLACK");
  const [second, setSecond] = useState<GameOfLifeColor>("BLACK");
  const [timerBelowHalf, setTimerBelowHalf] = useState(false);
  const [result, setResult] = useState<GameOfLifeOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleType = cruel ? ModuleType.GAME_OF_LIFE_CRUEL : ModuleType.GAME_OF_LIFE_SIMPLE;

  useSolverModulePersistence<PersistedState, GameOfLifeOutput>({
    state: { cells, timerBelowHalf, result },
    onRestoreState: (state) => {
      if (state.cells?.length === 48) setCells(state.cells);
      if (state.timerBelowHalf !== undefined) setTimerBelowHalf(state.timerBelowHalf);
      if (state.result !== undefined) setResult(state.result);
    },
    onRestoreSolution: setResult,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const setGrid = (color: GameOfLifeColor) => setCells(Array.from({ length: 48 }, () => ({ first: color, second: color })));
  const setCell = (index: number) => setCells((current) => current.map((cell, cellIndex) => cellIndex !== index ? cell : cruel
    ? { first, second }
    : { first: cell.first === "WHITE" ? "BLACK" : "WHITE", second: cell.first === "WHITE" ? "BLACK" : "WHITE" }));

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveGameOfLife(round.id, bomb.id, currentModule.id, { cells, timerBelowHalf });
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { cells, timerBelowHalf, result: response.output }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Game of Life"); }
    finally { setIsLoading(false); }
  };

  const reset = () => {
    setCells(emptyGrid()); setFirst("BLACK"); setSecond("BLACK"); setTimerBelowHalf(false); setResult(null); resetSolverState();
  };

  const grid = (whiteCells?: boolean[]) => <div className="mx-auto grid max-w-md grid-cols-6 gap-1" role="grid" aria-label={whiteCells ? "Final grid" : "Initial grid"}>
    {(whiteCells ?? cells).map((cell, index) => {
      const observed = typeof cell === "boolean" ? { first: cell ? "WHITE" : "BLACK", second: cell ? "WHITE" : "BLACK" } as GameOfLifeCell : cell;
      return whiteCells
        ? <div key={index} role="gridcell" aria-label={`${coordinate(index)} ${label(observed.first)}`} className="aspect-square rounded border border-border" style={{ background: background(observed) }} />
        : <button key={index} type="button" role="gridcell" aria-label={`${coordinate(index)}: ${label(observed.first)}${observed.first === observed.second ? "" : ` / ${label(observed.second)}`}`}
            disabled={isLoading || isSolved} onClick={() => setCell(index)} className="aspect-square rounded border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ background: background(observed) }} />;
    })}
  </div>;

  return <SolverLayout>
    {cruel && <SolverSection title="Cell palette" description="Choose the two colors observed while a cell flashes. Choose the same color for a solid cell.">
      <div className="grid gap-3 sm:grid-cols-2">
        {[["First observed color", first, setFirst], ["Second observed color", second, setSecond]].map(([text, value, setter]) => <label key={text as string} className="text-sm font-medium">
          {text as string}
          <select value={value as string} onChange={(event) => {
            const color = event.target.value as GameOfLifeColor;
            (setter as (color: GameOfLifeColor) => void)(color);
            if (color === "WHITE") { setFirst("WHITE"); setSecond("WHITE"); }
          }} disabled={isLoading || isSolved} className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            {COLORS.map((color) => <option key={color} value={color}>{label(color)}</option>)}
          </select>
        </label>)}
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={timerBelowHalf} onChange={(event) => setTimerBelowHalf(event.target.checked)} disabled={isLoading || isSolved} />
        Timer is below half of the bomb’s original time
      </label>
    </SolverSection>}

    <SolverSection title="Initial 6×8 grid" description={cruel ? "Select a palette pair, then apply it to each matching cell." : "Toggle each white cell; black is selected by default."}>
      {grid()}
      <div className="mt-4 flex justify-center gap-2">
        <Button type="button" variant="outline" onClick={() => setGrid("BLACK")} disabled={isLoading || isSolved}>Fill black</Button>
        <Button type="button" variant="outline" onClick={() => setGrid("WHITE")} disabled={isLoading || isSolved}>Fill white</Button>
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate final grid" />
    <ErrorAlert error={error} />
    {result && <SolverSection title={result.submitInitial ? "Submit the initial grid" : "Final grid"}>
      {!result.submitInitial && grid(result.whiteCells)}
      {result.submitInitial && <p className="text-center font-semibold text-emerald-700 dark:text-emerald-300">BOB applies: press Submit without changing a cell.</p>}
    </SolverSection>}
    {result && <TwitchCommandDisplay command={generateTwitchCommand({ moduleType, result })} />}
    <SolverInstructions>{cruel
      ? "Record both colors for flashing cells. Recalculate if the timer crosses halfway or the strike/solved-module count changes before submitting."
      : "Enter the displayed grid; the result applies one simultaneous Conway generation."}</SolverInstructions>
  </SolverLayout>;
}

export const GameOfLifeSimpleSolver = ({ bomb }: { bomb: BombEntity | null | undefined }) => <GameOfLifeSolver bomb={bomb} cruel={false} />;
export const GameOfLifeCruelSolver = ({ bomb }: { bomb: BombEntity | null | undefined }) => <GameOfLifeSolver bomb={bomb} cruel />;
