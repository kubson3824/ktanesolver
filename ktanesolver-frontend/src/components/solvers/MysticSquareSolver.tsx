import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import {
  solveMysticSquare,
  type MysticSquareOutput,
  type MysticSquareInput,
} from "../../services/mysticSquareService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";

const CELL_OPTIONS = ["", "1", "2", "3", "4", "5", "6", "7", "8"] as const;

const DEFAULT_GRID: (number | null)[] = [1, 2, 3, 4, 5, 6, 7, 8, null];

function indexToRowCol(i: number): { row: number; col: number } {
  return { row: Math.floor(i / 3) + 1, col: (i % 3) + 1 };
}

interface MysticSquareSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function MysticSquareSolver({ bomb }: MysticSquareSolverProps) {
  const [grid, setGrid] = useState<(number | null)[]>(() => [...DEFAULT_GRID]);
  const [result, setResult] = useState<MysticSquareOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const {
    isLoading,
    error,
    isSolved,
    setIsLoading,
    setError,
    setIsSolved,
    clearError,
    reset: resetSolverState,
    currentModule,
    round,
    markModuleSolved,
  } = useSolver();

  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);

  const moduleState = useMemo(() => ({ grid, result, twitchCommand }), [grid, result, twitchCommand]);

  const onRestoreState = useCallback(
    (state: { grid?: (number | null)[]; result?: MysticSquareOutput | null; twitchCommand?: string; input?: MysticSquareInput }) => {
      if (state.grid?.length === 9) setGrid(state.grid);
      else if (state.input?.grid?.length === 9) setGrid(state.input.grid);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    []
  );

  const onRestoreSolution = useCallback((solution: MysticSquareOutput) => {
    if (solution != null) {
      setResult(solution);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.MYSTIC_SQUARE,
          result: { skullPosition: solution.skullPosition, targetConstellation: solution.targetConstellation },
        })
      );
    }
  }, []);

  useSolverModulePersistence<
    { grid: (number | null)[]; result: MysticSquareOutput | null; twitchCommand: string },
    MysticSquareOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null || typeof raw !== "object") return null;
      const o = raw as { skullPosition?: number; targetConstellation?: (number | null)[] };
      if (typeof o.skullPosition !== "number" || !Array.isArray(o.targetConstellation)) return null;
      return o as MysticSquareOutput;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const setCell = useCallback((index: number, value: string) => {
    setGrid((prev) => {
      const next = [...prev];
      next[index] = value === "" ? null : parseInt(value, 10);
      return next;
    });
  }, []);

  const validateGrid = useCallback((g: (number | null)[]): string | null => {
    const emptyCount = g.filter((v) => v === null).length;
    if (emptyCount !== 1) return "Exactly one cell must be empty.";
    const numbers = g.filter((v): v is number => v !== null);
    const set = new Set(numbers);
    if (set.size !== 8) return "Each number 1–8 must appear exactly once.";
    for (let n = 1; n <= 8; n++) {
      if (!set.has(n)) return "Each number 1–8 must appear exactly once.";
    }
    return null;
  }, []);

  const handleSolve = useCallback(async () => {
    const err = validateGrid(grid);
    if (err) {
      setError(err);
      return;
    }
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const input: MysticSquareInput = { grid: [...grid] };
      const response = await solveMysticSquare(round.id, bomb.id, currentModule.id, { input });
      const output = response.output;
      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({
        moduleType: ModuleType.MYSTIC_SQUARE,
        result: { skullPosition: output.skullPosition, targetConstellation: output.targetConstellation },
      });
      setTwitchCommand(command);
      updateModuleAfterSolve(bomb.id, currentModule.id, { grid, result: output, twitchCommand: command }, output, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Solve failed.");
    } finally {
      setIsLoading(false);
    }
  }, [grid, round?.id, bomb?.id, currentModule?.id, validateGrid, setIsLoading, clearError, setIsSolved, markModuleSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setGrid([...DEFAULT_GRID]);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  const canSolve = useMemo(() => validateGrid(grid) === null, [grid, validateGrid]);

  const skullRowCol = result ? indexToRowCol(result.skullPosition) : null;

  return (
    <SolverLayout>
      <div className="rounded-xl border-2 border-neutral-600 bg-neutral-700/95 shadow-lg p-5 text-neutral-100">
        <p className="text-sm text-neutral-300 mb-4">
          Enter the current 3×3 grid. One cell must be empty; the rest must be 1–8, each once.
        </p>
        <div className="grid grid-cols-3 gap-2 w-fit mx-auto mb-6">
          {grid.map((value, i) => (
            <select
              key={i}
              value={value === null ? "" : String(value)}
              onChange={(e) => setCell(i, e.target.value)}
              disabled={isLoading || isSolved}
              className="w-14 h-14 rounded-lg bg-neutral-800 border border-neutral-600 text-yellow-400 text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-yellow-500/50 disabled:opacity-70"
              aria-label={`Cell ${Math.floor(i / 3) + 1},${(i % 3) + 1}`}
            >
              {CELL_OPTIONS.map((opt) => (
                <option key={opt || "empty"} value={opt}>
                  {opt || "—"}
                </option>
              ))}
            </select>
          ))}
        </div>

        <ErrorAlert message={error} onDismiss={clearError} />

        {result && (
          <div className="space-y-4 mt-4 p-4 rounded-lg bg-neutral-800/80">
            <p className="font-medium text-amber-400">
              Skull position: row {skullRowCol?.row}, column {skullRowCol?.col} (do not uncover before the knight).
            </p>
            <p className="text-sm text-neutral-300">Target constellation (arrange the sliders to match):</p>
            <div className="grid grid-cols-3 gap-2 w-fit">
              {(result.targetConstellation ?? []).map((v, i) => (
                <div
                  key={i}
                  className="w-14 h-14 rounded-lg border border-neutral-600 bg-neutral-700 flex items-center justify-center text-xl font-bold text-yellow-400"
                >
                  {v ?? "—"}
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-400">Default (1–2–3 / 4–5–6 / 7–8–empty) is always acceptable.</p>
          </div>
        )}

        <SolverControls
          onSolve={handleSolve}
          onReset={reset}
          canSolve={canSolve}
          isLoading={isLoading}
          isSolved={isSolved}
        />
        <TwitchCommandDisplay command={twitchCommand} />
      </div>
    </SolverLayout>
  );
}
