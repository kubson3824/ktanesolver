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
  SolverSection,
  SolverInstructions,
  SolverControls,
  SolverResult,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { cn } from "../../lib/cn";

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
  }, [grid, round?.id, bomb?.id, currentModule?.id, validateGrid, setIsLoading, setError, clearError, setIsSolved, markModuleSolved, updateModuleAfterSolve]);

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
      <SolverSection
        title="Current grid"
        description="Enter the 3×3 grid. Exactly one cell must be empty; the rest are 1–8, each once."
      >
        <div className="mx-auto grid w-fit grid-cols-3 gap-2">
          {grid.map((value, i) => (
            <select
              key={i}
              value={value === null ? "" : String(value)}
              onChange={(e) => setCell(i, e.target.value)}
              disabled={isLoading || isSolved}
              className={cn(
                "h-14 w-14 rounded-lg border text-center text-xl font-bold",
                "border-border bg-muted/40 text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                "disabled:opacity-70",
                value === null && "text-muted-foreground",
              )}
              aria-label={`Cell row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}`}
            >
              {CELL_OPTIONS.map((opt) => (
                <option key={opt || "empty"} value={opt}>
                  {opt || "—"}
                </option>
              ))}
            </select>
          ))}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!canSolve}
        isLoading={isLoading}
        isSolved={isSolved}
      />

      <ErrorAlert error={error} />

      {result && (
        <>
          <SolverResult
            variant="success"
            title="Skull position"
            description={`Row ${skullRowCol?.row}, column ${skullRowCol?.col}. Do not uncover before the knight.`}
          />

          <SolverSection
            title="Target constellation"
            description="Arrange the sliders to match this layout. The default (1–2–3 / 4–5–6 / 7–8–empty) is always acceptable."
          >
            <div className="mx-auto grid w-fit grid-cols-3 gap-2">
              {(result.targetConstellation ?? []).map((v, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-lg border text-xl font-bold",
                    v === null
                      ? "border-dashed border-border bg-muted/20 text-muted-foreground"
                      : "border-emerald-500/40 bg-emerald-500/10 text-foreground",
                  )}
                >
                  {v ?? "—"}
                </div>
              ))}
            </div>
          </SolverSection>
        </>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Enter the current tile layout. The solver returns the skull's location and the target
        constellation to slide tiles into.
      </SolverInstructions>
    </SolverLayout>
  );
}
