import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import { solveMinesweeper, type MinesweeperInput, type MinesweeperOutput } from "../../services/minesweeperService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import {
  ColorSwatchPicker, ErrorAlert, SolverControls, SolverInstructions, SolverLayout,
  SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence,
  type ColorSwatchOption,
} from "../common";

const WIDTH = 8;
const HEIGHT = 10;
const COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const EMPTY_COLORS = Array<string>(WIDTH * HEIGHT).fill("");
const EMPTY_BOARD = Array<string>(WIDTH * HEIGHT).fill("?");
const BOARD_VALUES = ["?", ".", "1", "2", "3", "4", "5", "6", "7", "8", "F"];
const BOARD_LABELS: Record<string, string> = { "?": "Covered", ".": "Empty", F: "Flag" };

type CellColor = "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "black";
type Phase = "colors" | "board";

const COLOR_OPTIONS: ReadonlyArray<ColorSwatchOption<CellColor>> = [
  { value: "red", label: "Red", swatch: "bg-red-500" },
  { value: "orange", label: "Orange", swatch: "bg-orange-500" },
  { value: "yellow", label: "Yellow", swatch: "bg-yellow-400" },
  { value: "green", label: "Green", swatch: "bg-green-500" },
  { value: "blue", label: "Blue", swatch: "bg-blue-500" },
  { value: "purple", label: "Purple", swatch: "bg-purple-500" },
  { value: "black", label: "Black", swatch: "bg-black" },
];

const COLOR_CLASSES: Record<string, string> = {
  red: "bg-red-500 text-white", orange: "bg-orange-500 text-white", yellow: "bg-yellow-400 text-black",
  green: "bg-green-500 text-white", blue: "bg-blue-500 text-white", purple: "bg-purple-500 text-white",
  black: "bg-black text-white",
};

type SavedState = {
  colors?: string[];
  board?: string[];
  phase?: Phase;
  startingCell?: string;
  startingColor?: string;
  result?: MinesweeperOutput | null;
  twitchCommand?: string;
  input?: MinesweeperInput;
};

function coordinate(index: number) {
  return `${COLUMNS[index % WIDTH]}${Math.floor(index / WIDTH) + 1}`;
}

function twitchCell(cell: string) {
  return `${cell.charCodeAt(0) - 64} ${cell.slice(1)}`;
}

function commandFor(output: MinesweeperOutput) {
  return [
    ...output.mines.map((cell) => `flag ${twitchCell(cell)}`),
    ...output.safeCells.map((cell) => `dig ${twitchCell(cell)}`),
  ].join("; ");
}

export default function MinesweeperSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [colors, setColors] = useState(EMPTY_COLORS);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [phase, setPhase] = useState<Phase>("colors");
  const [selectedColor, setSelectedColor] = useState<CellColor | null>("red");
  const [startingCell, setStartingCell] = useState("");
  const [startingColor, setStartingColor] = useState("");
  const [result, setResult] = useState<MinesweeperOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo<SavedState>(() => ({
    colors, board, phase, startingCell, startingColor, result, twitchCommand,
  }), [colors, board, phase, startingCell, startingColor, result, twitchCommand]);

  useSolverModulePersistence<SavedState, MinesweeperOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      const restoredColors = saved.colors?.length === 80 ? saved.colors : saved.input?.colors;
      if (restoredColors?.length === 80) setColors(restoredColors);
      if (saved.board?.length === 80) setBoard(saved.board);
      else if (saved.input?.board?.length === 10) setBoard(saved.input.board.flatMap((row) => [...row]));
      if (saved.phase) setPhase(saved.phase);
      else if (saved.input?.board || saved.startingCell) setPhase("board");
      if (saved.startingCell) setStartingCell(saved.startingCell);
      if (saved.startingColor) setStartingColor(saved.startingColor);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: MinesweeperOutput) => {
      setStartingCell(solution.startingCell);
      setStartingColor(solution.startingColor);
      setResult(solution);
      setPhase("board");
      if (solution.mines.length || solution.safeCells.length) setTwitchCommand(commandFor(solution));
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const setCellColor = (index: number) => {
    setColors((current) => current.map((color, cell) => {
      if (cell === index) return selectedColor ?? "";
      return selectedColor && color === selectedColor ? "" : color;
    }));
    clearError();
  };

  const setBoardCell = (index: number, value: string) => {
    setBoard((current) => current.map((cell, cellIndex) => cellIndex === index ? value : cell));
    setResult(null); setTwitchCommand(""); clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input: MinesweeperInput = {
        colors,
        board: phase === "colors" ? null : Array.from({ length: HEIGHT }, (_, row) =>
          board.slice(row * WIDTH, (row + 1) * WIDTH).join("")),
      };
      const response = await solveMinesweeper(round.id, bomb.id, currentModule.id, input);
      const nextPhase: Phase = "board";
      const command = phase === "colors" ? `dig ${response.output.startingColor}` : commandFor(response.output);
      setStartingCell(response.output.startingCell); setStartingColor(response.output.startingColor);
      setResult(response.output); setPhase(nextPhase); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        colors, board, phase: nextPhase, startingCell: response.output.startingCell,
        startingColor: response.output.startingColor, result: response.output, twitchCommand: command,
      }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Minesweeper"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, colors, board, phase, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setColors(EMPTY_COLORS); setBoard(EMPTY_BOARD); setPhase("colors"); setSelectedColor("red");
    setStartingCell(""); setStartingColor(""); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  const coloredCount = colors.filter(Boolean).length;

  return <SolverLayout>
    {phase === "colors" ? <>
      <SolverSection title="Colored cells" description="Choose a color, then place each of the 5–7 colored cells on the grid. Choose clear to erase a cell.">
        <ColorSwatchPicker value={selectedColor} options={COLOR_OPTIONS} onChange={setSelectedColor} disabled={isLoading} ariaLabel="Cell color" className="mb-4 flex-wrap" />
        <div className="grid grid-cols-8 gap-1" role="grid" aria-label="Minesweeper colored cells">
          {colors.map((color, index) => <button key={index} type="button" role="gridcell" aria-label={`${coordinate(index)}${color ? ` ${color}` : " uncolored"}`} onClick={() => setCellColor(index)} disabled={isLoading}
            className={cn("flex aspect-square items-center justify-center rounded border border-border text-xs font-bold", color ? COLOR_CLASSES[color] : "bg-muted/40 text-muted-foreground")}>
            {color ? (color === "black" ? "K" : color[0].toUpperCase()) : "·"}
          </button>)}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">{coloredCount} colored cells</p>
      </SolverSection>
    </> : <>
      {startingCell && <SolverSection title={`First dig: ${startingCell}`} description={`Dig the ${startingColor} cell, then enter every revealed number below.`} className="border-sky-500/40">
        <div className={cn("mx-auto flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold capitalize", COLOR_CLASSES[startingColor])}>{startingColor === "black" ? "K" : startingColor[0]?.toUpperCase()}</div>
      </SolverSection>}
      <SolverSection title="Current board" description="Set revealed blanks and numbers, plus flags already placed. Leave covered cells as ?.">
        <div className="space-y-1" role="grid" aria-label="Current Minesweeper board">
          <div className="grid gap-1 text-center text-xs font-semibold text-muted-foreground" style={{ gridTemplateColumns: "1.5rem repeat(8, minmax(0, 1fr))" }}>
            <span />{COLUMNS.map((column) => <span key={column}>{column}</span>)}
          </div>
          {Array.from({ length: HEIGHT }, (_, row) => <div key={row} className="grid gap-1" style={{ gridTemplateColumns: "1.5rem repeat(8, minmax(0, 1fr))" }}>
            <span className="self-center text-center text-xs font-semibold text-muted-foreground">{row + 1}</span>
            {board.slice(row * WIDTH, (row + 1) * WIDTH).map((value, column) => {
              const index = row * WIDTH + column;
              return <select key={index} value={value} onChange={(event) => setBoardCell(index, event.target.value)} disabled={isLoading || isSolved}
                aria-label={`${coordinate(index)}: ${BOARD_LABELS[value] ?? value}`} title={coordinate(index)}
                className={cn("aspect-square min-w-0 rounded border border-border bg-background text-center text-xs font-bold", value === "F" && "bg-amber-500/20 text-amber-700 dark:text-amber-300", value === "." && "text-muted-foreground")}>
                {BOARD_VALUES.map((option) => <option key={option} value={option}>{BOARD_LABELS[option] ?? option}</option>)}
              </select>;
            })}
          </div>)}
        </div>
      </SolverSection>
    </>}
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved}
      isSolveDisabled={phase === "colors" && (coloredCount < 5 || coloredCount > 7)} solveText={phase === "colors" ? "Find first dig" : "Find forced moves"} />
    <ErrorAlert error={error} />
    {phase === "board" && result && (result.mines.length > 0 || result.safeCells.length > 0) && <SolverSection title={isSolved ? "Flag to solve" : "Forced moves"} className="border-emerald-500/40">
      <div className="flex flex-wrap justify-center gap-2">
        {result.mines.map((cell) => <span key={`mine-${cell}`} className="rounded-md bg-amber-500/15 px-2 py-1 text-sm font-semibold text-amber-700 dark:text-amber-300">Flag {cell}</span>)}
        {result.safeCells.map((cell) => <span key={`safe-${cell}`} className="rounded-md bg-emerald-500/15 px-2 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">Dig {cell}</span>)}
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>After each set of forced moves, update all newly revealed cells and flags, then solve again.</SolverInstructions>
  </SolverLayout>;
}
