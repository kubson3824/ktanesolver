import { useCallback, useMemo, useState } from "react";
import { solveGridMatching, type GridMatchingOutput } from "../../services/gridMatchingService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const EMPTY_GRID = Array<boolean>(36).fill(false);

export default function GridMatchingSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [grid, setGrid] = useState(EMPTY_GRID);
  const [focusRow, setFocusRow] = useState(0);
  const [focusColumn, setFocusColumn] = useState(0);
  const [result, setResult] = useState<GridMatchingOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ grid, focusRow, focusColumn, result, twitchCommand }),
    [grid, focusRow, focusColumn, result, twitchCommand],
  );

  useSolverModulePersistence<typeof moduleState, GridMatchingOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.grid?.length === 36) setGrid(state.grid);
      if (state.focusRow !== undefined) setFocusRow(state.focusRow);
      if (state.focusColumn !== undefined) setFocusColumn(state.focusColumn);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      if (!solution?.letter) return;
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.GRID_MATCHING, result: solution }));
    },
    currentModule,
    setIsSolved,
  });

  const clearResult = () => {
    setResult(null); setTwitchCommand(""); clearError();
  };

  const toggleCell = (index: number) => {
    setGrid((current) => current.map((lit, position) => position === index ? !lit : lit));
    clearResult();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveGridMatching(
        round.id, bomb.id, currentModule.id, grid, focusRow, focusColumn,
      );
      const command = generateTwitchCommand({ moduleType: ModuleType.GRID_MATCHING, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id,
        { grid, focusRow, focusColumn, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Grid Matching"); }
    finally { setIsLoading(false); }
  }, [
    round?.id, bomb?.id, currentModule?.id, grid, focusRow, focusColumn, clearError,
    markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve,
  ]);

  const reset = useCallback(() => {
    setGrid(EMPTY_GRID); setFocusRow(0); setFocusColumn(0);
    setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Displayed grid" description="Toggle the lit cells, then set the focus box's top-left position.">
      <div className="mx-auto grid max-w-sm grid-cols-6 gap-1">
        {grid.map((lit, index) => {
          const row = Math.floor(index / 6);
          const column = index % 6;
          const focused = row >= focusRow && row < focusRow + 4
            && column >= focusColumn && column < focusColumn + 4;
          return <button
            key={index}
            type="button"
            aria-label={`Row ${row + 1}, column ${column + 1}: ${lit ? "lit" : "unlit"}`}
            aria-pressed={lit}
            disabled={isLoading || isSolved}
            onClick={() => toggleCell(index)}
            className={`aspect-square rounded border-2 ${focused ? "border-primary" : "border-border"} ${lit ? "bg-primary" : "bg-muted"}`}
          />;
        })}
      </div>
      <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-3">
        <label className="text-sm font-medium">
          Focus top row
          <select
            value={focusRow}
            onChange={(event) => { setFocusRow(Number(event.target.value)); clearResult(); }}
            disabled={isLoading || isSolved}
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
          >
            {[1, 2, 3].map((value) => <option key={value} value={value - 1}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">
          Focus left column
          <select
            value={focusColumn}
            onChange={(event) => { setFocusColumn(Number(event.target.value)); clearResult(); }}
            disabled={isLoading || isSolved}
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
          >
            {[1, 2, 3].map((value) => <option key={value} value={value - 1}>{value}</option>)}
          </select>
        </label>
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Match grid" />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Set letter ${result.letter}`} className="border-emerald-500/40">
      <p className="text-center text-lg font-semibold">
        {result.actions.length ? result.actions.join(" → ") : "Pattern already aligned"}
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground">Then set {result.letter} and submit.</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Rows and columns are numbered from the top left. The outlined 4×4 cells show the selected focus box.</SolverInstructions>
  </SolverLayout>;
}
