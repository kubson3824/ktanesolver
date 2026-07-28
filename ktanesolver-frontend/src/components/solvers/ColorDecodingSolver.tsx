import { useCallback, useMemo, useState } from "react";
import {
  solveColorDecoding,
  type ColorDecodingColor,
  type ColorDecodingOutput,
  type ColorDecodingPattern,
} from "../../services/colorDecodingService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  StageIndicator, TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { cn } from "../../lib/cn";

const COLORS: ColorDecodingColor[] = ["RED", "GREEN", "BLUE", "YELLOW", "PURPLE"];
const COLOR_STYLES: Record<ColorDecodingColor, string> = {
  RED: "bg-red-600", GREEN: "bg-green-600", BLUE: "bg-blue-600",
  YELLOW: "bg-yellow-400 text-black", PURPLE: "bg-purple-600",
};
const CODES: Record<string, ColorDecodingColor> = {
  R: "RED", G: "GREEN", B: "BLUE", Y: "YELLOW", P: "PURPLE",
};
const EMPTY_ROWS = Array(6).fill("") as string[];

type StageResult = ColorDecodingOutput & { stage: number; command: string };

export default function ColorDecodingSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState(1);
  const [pattern, setPattern] = useState<ColorDecodingPattern | "">("");
  const [indicatorColors, setIndicatorColors] = useState<ColorDecodingColor[]>([]);
  const [rows, setRows] = useState(EMPTY_ROWS);
  const [history, setHistory] = useState<StageResult[]>([]);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();

  const moduleState = useMemo(
    () => ({ stage, pattern, indicatorColors, rows, history }),
    [stage, pattern, indicatorColors, rows, history],
  );

  useSolverModulePersistence<typeof moduleState, ColorDecodingOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      const backendStages = (state as unknown as { stages?: unknown[] }).stages;
      if (Array.isArray(backendStages)) {
        setStage(Math.min(backendStages.length + 1, 3));
        return;
      }
      if (typeof state.stage === "number") setStage(state.stage);
      if (typeof state.pattern === "string") setPattern(state.pattern as ColorDecodingPattern);
      if (Array.isArray(state.indicatorColors)) setIndicatorColors(state.indicatorColors);
      if (Array.isArray(state.rows)) setRows(state.rows);
      if (Array.isArray(state.history)) setHistory(state.history);
    },
    onRestoreSolution: (solution) => {
      if (!solution?.selections?.length) return;
      const command = generateTwitchCommand({ moduleType: ModuleType.COLOR_DECODING, result: solution });
      setHistory([{ ...solution, stage: 3, command }]);
    },
    currentModule,
    setIsSolved,
  });

  const toggleColor = (color: ColorDecodingColor) => {
    if (pattern === "SOLID") setIndicatorColors([color]);
    else setIndicatorColors((current) =>
      current.includes(color) ? current.filter((value) => value !== color) : [...current, color],
    );
    clearError();
  };

  const display = rows.flatMap((row) =>
    row.trim().toUpperCase().split("").map((code) => CODES[code]!),
  );
  const indicatorValid = pattern === "SOLID"
    ? indicatorColors.length === 1
    : indicatorColors.length >= 2 && indicatorColors.length <= 4;
  const gridValid = rows.every((row) => /^[RGBYP]{6}$/i.test(row.trim()));

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!pattern || !indicatorValid) return setError("Select the pattern and its indicator colors");
    if (!gridValid) return setError("Enter six color codes in every row");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveColorDecoding(round.id, bomb.id, currentModule.id, {
        stage, pattern, indicatorColors, display,
      });
      const command = generateTwitchCommand({ moduleType: ModuleType.COLOR_DECODING, result: response.output });
      setHistory((current) => [...current, { ...response.output, stage, command }]);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      else {
        setStage((current) => current + 1);
        setPattern("");
        setIndicatorColors([]);
        setRows(EMPTY_ROWS);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Color Decoding");
    } finally {
      setIsLoading(false);
    }
  }, [
    round?.id, bomb?.id, currentModule?.id, pattern, indicatorValid, gridValid, stage,
    indicatorColors, display, clearError, markModuleSolved, setError, setIsLoading, setIsSolved,
  ]);

  const reset = () => {
    setStage(1); setPattern(""); setIndicatorColors([]); setRows(EMPTY_ROWS); setHistory([]);
    resetSolverState();
  };

  return <SolverLayout>
    <SolverSection title="Stage progress">
      <StageIndicator total={3} current={isSolved ? 4 : stage} completedThrough={isSolved ? 3 : stage - 1} />
    </SolverSection>

    {!isSolved && <>
      <SolverSection title={`Stage ${stage} indicator`} description="Choose its pattern and every color present.">
        <label className="block text-sm font-medium">
          Pattern
          <select
            value={pattern}
            onChange={(event) => {
              const next = event.target.value as ColorDecodingPattern | "";
              setPattern(next);
              if (next === "SOLID" && indicatorColors.length > 1) setIndicatorColors([]);
            }}
            disabled={isLoading}
            className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3"
          >
            <option value="">Select…</option>
            <option value="CHECKERED">Checkered</option>
            <option value="VERTICAL">Vertical</option>
            <option value="HORIZONTAL">Horizontal</option>
            <option value="SOLID">Solid</option>
          </select>
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {COLORS.map((color) => <button
            key={color}
            type="button"
            aria-pressed={indicatorColors.includes(color)}
            disabled={isLoading}
            onClick={() => toggleColor(color)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-semibold text-white opacity-50",
              COLOR_STYLES[color], indicatorColors.includes(color) && "opacity-100 ring-2 ring-ring",
            )}
          >
            {color[0] + color.slice(1).toLowerCase()}
          </button>)}
        </div>
      </SolverSection>

      <SolverSection title="6×6 display" description="Enter each row with R, G, B, Y, or P, for example RGBYPP.">
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.map((row, index) => <label key={index} className="text-sm font-medium">
            Row {index + 1}
            <input
              value={row}
              maxLength={6}
              spellCheck={false}
              disabled={isLoading}
              aria-label={`Display row ${index + 1}`}
              onChange={(event) => {
                const value = event.target.value.toUpperCase().replace(/[^RGBYP]/g, "");
                setRows((current) => current.map((item, position) => position === index ? value : item));
                clearError();
              }}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 font-mono uppercase tracking-[0.3em]"
            />
          </label>)}
        </div>
      </SolverSection>
    </>}

    <SolverControls
      onSolve={solve}
      onReset={reset}
      isLoading={isLoading}
      isSolved={isSolved}
      isSolveDisabled={!pattern || !indicatorValid || !gridValid}
      solveText={`Solve stage ${stage}`}
    />
    <ErrorAlert error={error} />

    {history.map((result) => <SolverSection key={result.stage} title={`Stage ${result.stage} · constraint set ${result.constraintSet}`}>
      <ol className="flex flex-wrap gap-2">
        {result.selections.map((selection, index) => <li
          key={`${selection.type}-${selection.index}`}
          className="rounded-md border border-emerald-500 bg-emerald-500/15 px-3 py-2 font-semibold"
        >
          {index + 1}. {selection.type === "ROW" ? "Row" : "Column"} {selection.index}
        </li>)}
      </ol>
    </SolverSection>)}

    {history.length > 0 && <TwitchCommandDisplay command={history.map((result) => result.command)} />}
    <SolverInstructions>
      Sequence constraints work forwards or backwards. Press the listed rows and columns in order before entering the next stage.
    </SolverInstructions>
  </SolverLayout>;
}
