import { useState } from "react";
import {
  solveColoredSquares,
  type ColoredSquaresGroup,
  type ColoredSquaresOutput,
} from "../../services/coloredSquaresService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { Input } from "../ui/input";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverResult,
  SolverSection,
  useSolver,
  useSolverModulePersistence,
} from "../common";

const GROUPS: ColoredSquaresGroup[] = ["RED", "BLUE", "GREEN", "YELLOW", "MAGENTA", "ROW", "COLUMN"];
const LABELS = { RED: "Red", BLUE: "Blue", GREEN: "Green", YELLOW: "Yellow", MAGENTA: "Magenta", ROW: "Topmost row", COLUMN: "Leftmost column" };

interface PersistedState {
  whiteCount?: number;
  previousGroup?: ColoredSquaresGroup;
  result?: ColoredSquaresOutput | null;
}

export default function ColoredSquaresSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [whiteCount, setWhiteCount] = useState(1);
  const [previousGroup, setPreviousGroup] = useState<ColoredSquaresGroup>("RED");
  const [result, setResult] = useState<ColoredSquaresOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);

  useSolverModulePersistence<PersistedState, ColoredSquaresOutput>({
    state: { whiteCount, previousGroup, result },
    onRestoreState: (state) => {
      if (state.whiteCount !== undefined) setWhiteCount(state.whiteCount);
      if (state.previousGroup) setPreviousGroup(state.previousGroup);
      if (state.result !== undefined) setResult(state.result);
    },
    onRestoreSolution: (solution) => {
      setResult(solution);
      if (solution.group) setPreviousGroup(solution.group);
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (whiteCount < 1 || whiteCount > 16) return setError("Total white squares must be between 1 and 16");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveColoredSquares(round.id, bomb.id, currentModule.id, {
        whiteCount,
        previousGroup,
      });
      const nextGroup = response.output.group ?? previousGroup;
      setPreviousGroup(nextGroup);
      setResult(response.output);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { whiteCount, previousGroup: nextGroup, result: response.output },
        response.output,
        response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Colored Squares");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setWhiteCount(1);
    setPreviousGroup("RED");
    setResult(null);
    resetSolverState();
  };

  return <SolverLayout>
    <SolverSection
      title={result === null ? "First group pressed" : "Report the last press"}
      description={result === null
        ? "The manual reader chooses the unique least-common color."
        : `Press ${LABELS[previousGroup]}, then enter the new total number of white squares.`}
    >
      <label className="block text-sm font-medium">
        Group pressed
        <select
          value={previousGroup}
          onChange={(event) => setPreviousGroup(event.target.value as ColoredSquaresGroup)}
          disabled={isLoading || isSolved || result !== null}
          className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {GROUPS.map((group) => <option key={group} value={group}>{LABELS[group]}</option>)}
        </select>
      </label>
      <label className="mt-4 block text-sm font-medium">
        Total white squares
        <Input
          type="number"
          min={1}
          max={16}
          value={whiteCount}
          onChange={(event) => setWhiteCount(event.target.valueAsNumber || 0)}
          disabled={isLoading || isSolved}
          className="mt-2"
        />
      </label>
    </SolverSection>

    <SolverControls
      onSolve={solve}
      onReset={reset}
      isSolveDisabled={whiteCount < 1 || whiteCount > 16}
      isLoading={isLoading}
      isSolved={isSolved}
      solveText="Get next group"
    />
    <ErrorAlert error={error} />
    {result?.group && <SolverResult title={`Press ${LABELS[result.group]}`} />}
    <SolverInstructions>
      Start with the unique least-common color from the manual. After every press, enter the total number of white squares and the solver tells you the next group.
    </SolverInstructions>
  </SolverLayout>;
}
