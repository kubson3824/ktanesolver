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
  SolverSection,
  SolverInstructions,
  SolverControls,
  SolverResult,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { cn } from "../../lib/cn";

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

const SELECT_CLASS =
  "h-11 rounded-md border border-border bg-card px-2 text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

export default function LogicSolver({ bomb }: LogicSolverProps) {
  const [rows, setRows] = useState<RowState[]>(() => [defaultRow(), defaultRow()]);
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
    (state: { rows?: RowState[]; result?: LogicOutput | null; twitchCommand?: string; input?: { rows?: LogicRowInput[] } }) => {
      const restorableRows = state.rows?.length
        ? state.rows
        : state.input?.rows?.map((r) => ({
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
    { rows: RowState[]; result: LogicOutput | null; twitchCommand: string },
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

      const command = generateTwitchCommand({
        moduleType: ModuleType.LOGIC,
        result: { answers: output.answers },
      });
      setTwitchCommand(command);

      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { rows, result: output, twitchCommand: command },
        { answers: output.answers },
        true
      );
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

  const formDisabled = isLoading || isSolved;

  const Statement = ({
    rowIndex,
    slot,
    negated,
    letter,
    onToggle,
    onLetter,
    label,
  }: {
    rowIndex: number;
    slot: 1 | 2 | 3;
    negated: boolean;
    letter: string;
    onToggle: () => void;
    onLetter: (v: string) => void;
    label: string;
  }) => (
    <div className="flex flex-col items-center">
      <button
        type="button"
        role="checkbox"
        aria-checked={negated}
        aria-label={`Row ${rowIndex + 1} statement ${slot} negation LED`}
        onClick={() => !formDisabled && onToggle()}
        className={cn(
          "mb-1 h-3 w-11 rounded border transition-colors sm:w-12",
          negated
            ? "border-red-500 bg-red-500"
            : "border-border bg-muted/40 hover:bg-muted",
          formDisabled && "cursor-not-allowed opacity-60",
        )}
      />
      <input
        type="text"
        maxLength={1}
        value={letter}
        onChange={(e) => onLetter(e.target.value.toUpperCase())}
        className="h-11 w-11 rounded-md border border-border bg-card text-center text-xl font-bold uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:w-12 sm:text-2xl"
        disabled={formDisabled}
        aria-label={label}
      />
    </div>
  );

  return (
    <SolverLayout>
      <SolverSection
        title="Logic statements"
        description="Enter the two rows shown on the module. The red LED above each statement marks it as negated. Use the (AB)C / A(BC) toggle to set the bracketing."
      >
        <div className="space-y-6">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-wrap items-end justify-center gap-1">
              {row.leftGrouped && (
                <span
                  className="select-none text-2xl font-bold leading-[2.75rem] text-muted-foreground sm:text-3xl"
                  aria-hidden
                >
                  (
                </span>
              )}

              <Statement
                rowIndex={rowIndex}
                slot={1}
                negated={row.negated1}
                letter={row.letter1}
                onToggle={() => setRow(rowIndex, (r) => ({ ...r, negated1: !r.negated1 }))}
                onLetter={(v) => setRow(rowIndex, (r) => ({ ...r, letter1: v }))}
                label={`Row ${rowIndex + 1} first letter`}
              />

              <select
                value={row.connective1}
                onChange={(e) =>
                  setRow(rowIndex, (r) => ({ ...r, connective1: e.target.value as LogicConnective }))
                }
                className={SELECT_CLASS}
                disabled={formDisabled}
                aria-label={`Row ${rowIndex + 1} first connective`}
              >
                {CONNECTIVE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.symbol}</option>
                ))}
              </select>

              {!row.leftGrouped && (
                <span
                  className="select-none text-2xl font-bold leading-[2.75rem] text-muted-foreground sm:text-3xl"
                  aria-hidden
                >
                  (
                </span>
              )}

              <Statement
                rowIndex={rowIndex}
                slot={2}
                negated={row.negated2}
                letter={row.letter2}
                onToggle={() => setRow(rowIndex, (r) => ({ ...r, negated2: !r.negated2 }))}
                onLetter={(v) => setRow(rowIndex, (r) => ({ ...r, letter2: v }))}
                label={`Row ${rowIndex + 1} second letter`}
              />

              {row.leftGrouped && (
                <span
                  className="select-none text-2xl font-bold leading-[2.75rem] text-muted-foreground sm:text-3xl"
                  aria-hidden
                >
                  )
                </span>
              )}

              <select
                value={row.connective2}
                onChange={(e) =>
                  setRow(rowIndex, (r) => ({ ...r, connective2: e.target.value as LogicConnective }))
                }
                className={SELECT_CLASS}
                disabled={formDisabled}
                aria-label={`Row ${rowIndex + 1} second connective`}
              >
                {CONNECTIVE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.symbol}</option>
                ))}
              </select>

              <Statement
                rowIndex={rowIndex}
                slot={3}
                negated={row.negated3}
                letter={row.letter3}
                onToggle={() => setRow(rowIndex, (r) => ({ ...r, negated3: !r.negated3 }))}
                onLetter={(v) => setRow(rowIndex, (r) => ({ ...r, letter3: v }))}
                label={`Row ${rowIndex + 1} third letter`}
              />

              {!row.leftGrouped && (
                <span
                  className="select-none text-2xl font-bold leading-[2.75rem] text-muted-foreground sm:text-3xl"
                  aria-hidden
                >
                  )
                </span>
              )}

              <button
                type="button"
                onClick={() =>
                  !formDisabled && setRow(rowIndex, (r) => ({ ...r, leftGrouped: !r.leftGrouped }))
                }
                className={cn(
                  "ml-1 h-11 rounded-md border border-border bg-muted/40 px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
                  formDisabled && "cursor-not-allowed opacity-60",
                )}
                disabled={formDisabled}
                aria-label="Toggle bracket grouping"
                title="Toggle bracket grouping"
              >
                {row.leftGrouped ? "(AB)C" : "A(BC)"}
              </button>

              <div
                className={cn(
                  "ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 text-xl font-bold sm:h-12 sm:w-12",
                  result?.answers?.[rowIndex] === true && "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                  result?.answers?.[rowIndex] === false && "border-red-500 bg-red-500/15 text-red-700 dark:text-red-300",
                  result?.answers?.[rowIndex] === undefined && "border-border bg-muted/40 text-muted-foreground",
                )}
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
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!canSolve}
        isLoading={isLoading}
        isSolved={isSolved}
      />

      <ErrorAlert error={error} />

      {result && result.answers.length > 0 && (
        <SolverResult
          variant="success"
          title="Submit on the module"
          description={result.answers.map((a, i) => `Row ${i + 1}: ${a ? "True" : "False"}`).join("\n")}
        />
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Enter the three letters and two connectives for each row, set the bracket grouping, and
        toggle the red LED for any negated statement. The solver returns the truth value to submit
        for each row.
      </SolverInstructions>
    </SolverLayout>
  );
}
