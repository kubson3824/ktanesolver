import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import {
  solveLogic,
  type LogicConnective,
  type LogicRowInput,
  type LogicOutput,
} from "../../services/logicService";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";

const CONNECTIVE_OPTIONS: { value: LogicConnective; symbol: string; label: string }[] = [
  { value: "AND", symbol: "∧", label: "AND" },
  { value: "OR", symbol: "∨", label: "OR" },
  { value: "XOR", symbol: "⊻", label: "XOR" },
  { value: "NAND", symbol: "|", label: "NAND" },
  { value: "NOR", symbol: "↓", label: "NOR" },
  { value: "XNOR", symbol: "↔", label: "XNOR" },
  { value: "IMPL_LEFT", symbol: "→", label: "Impl L" },
  { value: "IMPL_RIGHT", symbol: "←", label: "Impl R" },
];

const getConnectiveSymbol = (c: LogicConnective) =>
  CONNECTIVE_OPTIONS.find((o) => o.value === c)?.symbol ?? "?";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type RowState = {
  letter1: string;
  letter2: string;
  letter3: string;
  connective1: LogicConnective;
  connective2: LogicConnective;
  negated1: boolean;
  negated2: boolean;
  negated3: boolean;
  leftGrouped: boolean;
};

const defaultRow = (): RowState => ({
  letter1: "",
  letter2: "",
  letter3: "",
  connective1: "AND",
  connective2: "OR",
  negated1: false,
  negated2: false,
  negated3: false,
  leftGrouped: true,
});

interface LogicSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function LogicSolver({ bomb }: LogicSolverProps) {
  const [rows, setRows] = useState<ReturnType<typeof defaultRow>[]>(() => [
    defaultRow(),
    defaultRow(),
  ]);
  const [result, setResult] = useState<LogicOutput | null>(null);
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

  const moduleState = useMemo(
    () => ({ rows, result, twitchCommand }),
    [rows, result, twitchCommand]
  );

  const onRestoreState = useCallback(
    (state: { rows?: typeof rows; result?: LogicOutput | null; twitchCommand?: string; input?: { rows?: LogicRowInput[] } }) => {
      const restorableRows = state.rows?.length ? state.rows : state.input?.rows?.map((r) => ({
        letter1: r.letter1,
        letter2: r.letter2,
        letter3: r.letter3,
        connective1: r.connective1,
        connective2: r.connective2,
        negated1: r.negated1,
        negated2: r.negated2,
        negated3: r.negated3,
        leftGrouped: r.leftGrouped,
      }));
      if (restorableRows?.length) setRows(restorableRows);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    []
  );

  const onRestoreSolution = useCallback((solution: LogicOutput) => {
    if (solution?.answers?.length) {
      setResult(solution);
      setTwitchCommand(
        generateTwitchCommand({ moduleType: ModuleType.LOGIC, result: { answers: solution.answers } })
      );
    }
  }, []);

  useSolverModulePersistence<
    { rows: typeof rows; result: LogicOutput | null },
    LogicOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object" && Array.isArray((raw as { answers?: unknown }).answers)) {
        return raw as LogicOutput;
      }
      return null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const setRow = useCallback((rowIndex: number, updater: (r: RowState) => RowState) => {
    setRows((prev) => {
      const next = [...prev];
      next[rowIndex] = updater(next[rowIndex] ?? defaultRow());
      return next;
    });
  }, []);

  const buildInput = useCallback((): LogicRowInput[] => {
    return rows.map((r) => ({
      letter1: (r.letter1 || " ").trim().toUpperCase().slice(0, 1) || "A",
      letter2: (r.letter2 || " ").trim().toUpperCase().slice(0, 1) || "A",
      letter3: (r.letter3 || " ").trim().toUpperCase().slice(0, 1) || "A",
      connective1: r.connective1,
      connective2: r.connective2,
      negated1: r.negated1,
      negated2: r.negated2,
      negated3: r.negated3,
      leftGrouped: r.leftGrouped,
    }));
  }, [rows]);

  const handleSolve = async () => {
    const built = buildInput();
    const valid = built.every(
      (r) =>
        LETTERS.includes(r.letter1) && LETTERS.includes(r.letter2) && LETTERS.includes(r.letter3)
    );
    if (!valid) {
      setError("Enter valid letters A–Z for each statement in every row.");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveLogic(round.id, bomb.id, currentModule.id, {
        input: { rows: built },
      });

      const output = response.output;
      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({ moduleType: ModuleType.LOGIC, result: { answers: output.answers } });
      setTwitchCommand(command);

      updateModuleAfterSolve(bomb.id, currentModule.id, { rows, result: output, twitchCommand: command }, { answers: output.answers }, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Solve failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setRows([defaultRow(), defaultRow()]);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const canSolve = rows.every(
    (r) =>
      r.letter1.trim().length > 0 &&
      r.letter2.trim().length > 0 &&
      r.letter3.trim().length > 0
  );

  return (
    <SolverLayout>
      {/* Module-style panel: gray metallic look, two rows, big SUBMIT */}
      <div className="rounded-xl border-2 border-neutral-600 bg-neutral-700/95 shadow-lg p-5 text-neutral-100">
        {/* Two rows of logic expressions */}
        <div className="space-y-6 mb-6">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-wrap items-end justify-center gap-0.5 sm:gap-1">
              {/* leftGrouped: ( A op1 B ) op2 C  →  open bracket before A */}
              {row.leftGrouped && (
                <span className="text-neutral-400 font-bold text-2xl sm:text-3xl leading-[2.75rem] select-none" aria-hidden>(</span>
              )}

              {/* Statement 1 + LED */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={row.negated1}
                  aria-label="Red LED above first statement"
                  onClick={() =>
                    !isLoading && !isSolved &&
                    setRow(rowIndex, (r) => ({ ...r, negated1: !r.negated1 }))
                  }
                  className={`w-11 sm:w-12 h-2.5 sm:h-3 rounded mb-1 transition-colors border ${
                    row.negated1
                      ? "bg-red-600 border-red-500/80 shadow-[0_0_8px_rgba(220,38,38,0.7)]"
                      : "bg-neutral-600 border-neutral-500"
                  } ${!isLoading && !isSolved ? "cursor-pointer hover:bg-neutral-500 hover:border-neutral-400" : "cursor-default"}`}
                />
                <input
                  type="text"
                  maxLength={1}
                  value={row.letter1}
                  onChange={(e) =>
                    setRow(rowIndex, (r) => ({ ...r, letter1: e.target.value.toUpperCase() }))
                  }
                  placeholder=""
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded bg-neutral-800 border border-neutral-600 text-yellow-400 text-xl sm:text-2xl font-bold text-center uppercase focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  disabled={isLoading || isSolved}
                  aria-label={`Row ${rowIndex + 1} first letter`}
                />
              </div>

              <select
                value={row.connective1}
                onChange={(e) =>
                  setRow(rowIndex, (r) => ({ ...r, connective1: e.target.value as LogicConnective }))
                }
                className="h-11 px-1.5 rounded bg-neutral-600 border border-neutral-500 text-yellow-400 text-lg font-medium focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
                disabled={isLoading || isSolved}
                aria-label={`Row ${rowIndex + 1} first connective`}
              >
                {CONNECTIVE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-neutral-800">
                    {opt.symbol}
                  </option>
                ))}
              </select>

              {/* A(BC): opening ( before B */}
              {!row.leftGrouped && (
                <span className="text-neutral-400 font-bold text-2xl sm:text-3xl leading-[2.75rem] select-none" aria-hidden>(</span>
              )}

              {/* Statement 2 + LED */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={row.negated2}
                  aria-label="Red LED above second statement"
                  onClick={() =>
                    !isLoading && !isSolved &&
                    setRow(rowIndex, (r) => ({ ...r, negated2: !r.negated2 }))
                  }
                  className={`w-11 sm:w-12 h-2.5 sm:h-3 rounded mb-1 transition-colors border ${
                    row.negated2
                      ? "bg-red-600 border-red-500/80 shadow-[0_0_8px_rgba(220,38,38,0.7)]"
                      : "bg-neutral-600 border-neutral-500"
                  } ${!isLoading && !isSolved ? "cursor-pointer hover:bg-neutral-500 hover:border-neutral-400" : "cursor-default"}`}
                />
                <input
                  type="text"
                  maxLength={1}
                  value={row.letter2}
                  onChange={(e) =>
                    setRow(rowIndex, (r) => ({ ...r, letter2: e.target.value.toUpperCase() }))
                  }
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded bg-neutral-800 border border-neutral-600 text-yellow-400 text-xl sm:text-2xl font-bold text-center uppercase focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  disabled={isLoading || isSolved}
                  aria-label={`Row ${rowIndex + 1} second letter`}
                />
              </div>

              {/* (AB)C: closing ) after B */}
              {row.leftGrouped && (
                <span className="text-neutral-400 font-bold text-2xl sm:text-3xl leading-[2.75rem] select-none" aria-hidden>)</span>
              )}

              <select
                value={row.connective2}
                onChange={(e) =>
                  setRow(rowIndex, (r) => ({ ...r, connective2: e.target.value as LogicConnective }))
                }
                className="h-11 px-1.5 rounded bg-neutral-600 border border-neutral-500 text-yellow-400 text-lg font-medium focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
                disabled={isLoading || isSolved}
                aria-label={`Row ${rowIndex + 1} second connective`}
              >
                {CONNECTIVE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-neutral-800">
                    {opt.symbol}
                  </option>
                ))}
              </select>

              {/* Statement 3 + LED */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={row.negated3}
                  aria-label="Red LED above third statement"
                  onClick={() =>
                    !isLoading && !isSolved &&
                    setRow(rowIndex, (r) => ({ ...r, negated3: !r.negated3 }))
                  }
                  className={`w-11 sm:w-12 h-2.5 sm:h-3 rounded mb-1 transition-colors border ${
                    row.negated3
                      ? "bg-red-600 border-red-500/80 shadow-[0_0_8px_rgba(220,38,38,0.7)]"
                      : "bg-neutral-600 border-neutral-500"
                  } ${!isLoading && !isSolved ? "cursor-pointer hover:bg-neutral-500 hover:border-neutral-400" : "cursor-default"}`}
                />
                <input
                  type="text"
                  maxLength={1}
                  value={row.letter3}
                  onChange={(e) =>
                    setRow(rowIndex, (r) => ({ ...r, letter3: e.target.value.toUpperCase() }))
                  }
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded bg-neutral-800 border border-neutral-600 text-yellow-400 text-xl sm:text-2xl font-bold text-center uppercase focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  disabled={isLoading || isSolved}
                  aria-label={`Row ${rowIndex + 1} third letter`}
                />
              </div>

              {/* A(BC): closing ) after C */}
              {!row.leftGrouped && (
                <span className="text-neutral-400 font-bold text-2xl sm:text-3xl leading-[2.75rem] select-none" aria-hidden>)</span>
              )}

              {/* Toggle grouping: click parentheses label */}
              <button
                type="button"
                onClick={() =>
                  !isLoading && !isSolved &&
                  setRow(rowIndex, (r) => ({ ...r, leftGrouped: !r.leftGrouped }))
                }
                className="h-11 ml-1 px-2 rounded bg-neutral-600/80 border border-neutral-500 text-neutral-400 text-xs font-medium hover:bg-neutral-600 focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
                disabled={isLoading || isSolved}
                aria-label="Toggle bracket grouping"
                title="Toggle bracket grouping"
              >
                {row.leftGrouped ? "(AB)C" : "A(BC)"}
              </button>

              {/* T/F result box - green, shows answer after solve */}
              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded flex items-center justify-center bg-green-600 border-2 border-green-500 text-white text-xl font-bold shrink-0"
                aria-label={`Row ${rowIndex + 1} answer`}
              >
                {result?.answers?.[rowIndex] !== undefined
                  ? result.answers[rowIndex]
                    ? "T"
                    : "F"
                  : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Solve + Reset (same as other modules) */}
      <div className="mt-6">
        <SolverControls
          onSolve={handleSolve}
          onReset={reset}
          isSolveDisabled={!canSolve}
          isLoading={isLoading}
          solveText="Solve"
        />
      </div>

      <ErrorAlert error={error} />

      {/* Solution below */}
      {result && result.answers.length > 0 && (
        <div className="alert alert-success mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-bold">Submit on the module:</p>
            <p className="text-sm mt-1">
              {result.answers.map((a, i) => `Row ${i + 1}: ${a ? "True" : "False"}`).join(" — ")}
            </p>
          </div>
        </div>
      )}

      <TwitchCommandDisplay command={twitchCommand} />
    </SolverLayout>
  );
}
