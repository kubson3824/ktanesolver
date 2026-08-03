import { useCallback, useMemo, useState } from "react";
import { solveX01, type X01Output } from "../../services/x01Service";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const OPTIONS = Array.from({ length: 20 }, (_, index) => index + 1);
const EMPTY_VALUES: Array<number | ""> = Array(10).fill("");

export default function X01Solver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [segmentValues, setSegmentValues] = useState(EMPTY_VALUES);
  const [result, setResult] = useState<X01Output | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ segmentValues, result, twitchCommand }),
    [segmentValues, result, twitchCommand],
  );

  useSolverModulePersistence<typeof moduleState, X01Output>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.segmentValues?.length === 10) setSegmentValues(state.segmentValues);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      if (!solution?.darts?.length) return;
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.X01, result: solution }));
    },
    currentModule,
    setIsSolved,
  });

  const changeValue = (index: number, value: string) => {
    setSegmentValues((current) => current.map((item, position) => position === index ? Number(value) || "" : item));
    setResult(null); setTwitchCommand(""); clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const values = segmentValues.filter((value): value is number => typeof value === "number");
    if (values.length !== 10) return setError("Enter all 10 segment values");
    if (new Set(values).size !== 10) return setError("Each segment value must be different");
    clearError(); setIsLoading(true);
    try {
      const response = await solveX01(round.id, bomb.id, currentModule.id, values);
      const command = generateTwitchCommand({ moduleType: ModuleType.X01, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id,
        { segmentValues: values, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve X01");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, segmentValues, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setSegmentValues(EMPTY_VALUES); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Dartboard values" description="Start at north and continue clockwise.">
      <div className="mx-auto grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-5">
        {segmentValues.map((value, index) => <label key={index} className="text-sm font-medium">
          Segment {index + 1}{index === 0 ? " (north)" : ""}
          <select
            value={value}
            onChange={(event) => changeValue(index, event.target.value)}
            disabled={isLoading || isSolved}
            aria-label={`Segment ${index + 1}${index === 0 ? " north" : ""}`}
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2"
          >
            <option value="">—</option>
            {OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>
    <SolverControls
      onSolve={solve}
      onReset={reset}
      isLoading={isLoading}
      isSolved={isSolved}
      isSolveDisabled={segmentValues.some((value) => !value)}
      solveText="Find checkout"
    />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`${result.targetScore} points in ${result.dartCount} darts`} className="border-emerald-500/40">
      <p className="mb-4 text-center text-sm text-muted-foreground">
        Restrictions: {result.restrictions || "none"}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {result.darts.map((dart, index) => <div
          key={`${dart}-${index}`}
          className="flex h-16 min-w-16 flex-col items-center justify-center rounded-lg border-2 border-emerald-500 bg-emerald-500/15 px-3 font-bold text-emerald-700 dark:text-emerald-300"
        >
          <span className="text-xs font-normal">Dart {index + 1}</span>
          <span className="text-lg">{dart}</span>
        </div>)}
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>
      OUT and IN are the outer and inner single areas; D and T are double and treble; SB and DB are the bullseyes.
    </SolverInstructions>
  </SolverLayout>;
}
