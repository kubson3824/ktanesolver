import { useCallback, useMemo, useState } from "react";
import { solveTicTacToe, type TicTacToeOutput } from "../../services/ticTacToeService";
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
import { ChevronDown } from "lucide-react";
import { Button } from "../ui/button";

const EMPTY_BOARD = Array<string>(9).fill("");
const CELL_OPTIONS = ["X", "O", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function TicTacToeSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [nextPiece, setNextPiece] = useState<"X" | "O">("X");
  const [strike, setStrike] = useState(false);
  const [result, setResult] = useState<TicTacToeOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ board, nextPiece, result, twitchCommand }),
    [board, nextPiece, result, twitchCommand],
  );

  const onRestoreState = useCallback((state: Partial<typeof moduleState>) => {
    if (state.board?.length === 9) setBoard(state.board);
    if (state.nextPiece === "X" || state.nextPiece === "O") setNextPiece(state.nextPiece);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: TicTacToeOutput) => {
    if (!solution?.action) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.TIC_TAC_TOE, result: solution }));
  }, []);

  useSolverModulePersistence<typeof moduleState, TicTacToeOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const changeCell = (index: number, value: string) => {
    setBoard((current) => current.map((cell, i) => i === index ? value : cell));
    setResult(null);
    setTwitchCommand("");
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const input = { board, nextPiece, strike };
      const response = await solveTicTacToe(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.TIC_TAC_TOE, result: response.output });
      const completedBoard = response.solved && response.output.automaticPlacement
        ? board.map((cell) => /^[1-9]$/.test(cell) ? nextPiece : cell)
        : board;
      setBoard(completedBoard);
      setResult(response.output);
      setTwitchCommand(command);
      setStrike(false);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, board: completedBoard, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Tic Tac Toe");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, board, nextPiece, strike, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setBoard(EMPTY_BOARD);
    setNextPiece("X");
    setStrike(true);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return (
    <SolverLayout>
      <SolverSection title="Board" description="Enter the actual number, X, or O shown in each physical cell.">
        <div className="mx-auto grid max-w-64 grid-cols-3 gap-2">
          {board.map((cell, index) => (
            <div key={index} className="relative">
              <select
                value={cell}
                onChange={(event) => changeCell(index, event.target.value)}
                disabled={isLoading || isSolved}
                aria-label={`Cell ${index + 1}`}
                className={`h-16 w-full cursor-pointer appearance-none rounded-lg border bg-muted/40 text-center text-2xl font-bold shadow-sm transition-colors hover:border-primary/50 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 ${cell === "" ? "text-muted-foreground" : "text-foreground"} ${result?.position === index + 1 ? "border-emerald-500 ring-2 ring-emerald-500" : "border-border"}`}
              >
                <option value="">—</option>
                {CELL_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute bottom-1.5 right-1.5 h-3 w-3 text-muted-foreground/60" aria-hidden />
            </div>
          ))}
        </div>
      </SolverSection>

      <SolverSection title="Up next">
        <div className="grid grid-cols-2 gap-2">
          {(["X", "O"] as const).map((piece) => (
            <Button key={piece} variant={nextPiece === piece ? "default" : "outline"} onClick={() => setNextPiece(piece)} disabled={isLoading || isSolved}>
              {piece}
            </Button>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={strike} onChange={(event) => setStrike(event.target.checked)} disabled={isLoading || isSolved} />
          A strike just occurred (reset to the starting row)
        </label>
      </SolverSection>

      <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Get next action" />
      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Next action" className="border-emerald-500/40">
          <div className="text-center text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {result.action === "PASS" ? "PRESS PASS" : `PRESS NUMBER ${result.number}`}
          </div>
          {result.automaticPlacement && !isSolved && (
            <div className="mt-3">
              <p className="mb-2 text-center text-sm text-muted-foreground">Where did the module place the {nextPiece}?</p>
              <div className="mx-auto grid max-w-64 grid-cols-3 gap-2">
                {board.map((cell, index) => (
                  <Button
                    key={index}
                    variant={/^[1-9]$/.test(cell) ? "outline" : "ghost"}
                    className="h-12 text-lg font-bold"
                    disabled={!/^[1-9]$/.test(cell)}
                    onClick={() => changeCell(index, nextPiece)}
                    aria-label={`Automatic ${nextPiece} appeared in cell ${index + 1}`}
                  >
                    {cell}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </SolverSection>
      )}
      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>Numbers move between cells, so copy the displayed layout exactly. After each action, update the board and Up Next display. Submit the unchanged board again after the first PASS.</SolverInstructions>
    </SolverLayout>
  );
}
