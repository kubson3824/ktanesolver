import { useState } from "react";
import {
  solveColoredSquares,
  type ColoredSquaresGroup,
  type ColoredSquaresOutput,
} from "../../services/coloredSquaresService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { Input } from "../ui/input";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverResult,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";

const GROUPS: ColoredSquaresGroup[] = ["RED", "BLUE", "GREEN", "YELLOW", "MAGENTA", "ROW", "COLUMN"];
const LABELS = { RED: "Red", BLUE: "Blue", GREEN: "Green", YELLOW: "Yellow", MAGENTA: "Magenta", ROW: "Topmost row", COLUMN: "Leftmost column" };

interface PersistedState {
  whiteCount?: number;
  previousGroup?: ColoredSquaresGroup;
  result?: ColoredSquaresOutput | null;
  coordinateText?: string;
}

const parseCoordinates = (value: string) => {
  const coordinates = value.trim().toUpperCase().split(/[\s,;]+/).filter(Boolean);
  return coordinates.every((coordinate) => /^[A-D][1-4]$/.test(coordinate)) ? coordinates : [];
};

export default function ColoredSquaresSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [whiteCount, setWhiteCount] = useState(1);
  const [previousGroup, setPreviousGroup] = useState<ColoredSquaresGroup>("RED");
  const [result, setResult] = useState<ColoredSquaresOutput | null>(null);
  const [coordinateText, setCoordinateText] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);

  useSolverModulePersistence<PersistedState, ColoredSquaresOutput>({
    state: { whiteCount, previousGroup, result, coordinateText },
    onRestoreState: (state) => {
      if (state.whiteCount !== undefined) setWhiteCount(state.whiteCount);
      if (state.previousGroup) setPreviousGroup(state.previousGroup);
      if (state.result !== undefined) setResult(state.result);
      if (state.coordinateText !== undefined) setCoordinateText(state.coordinateText);
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
      setCoordinateText("");
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { whiteCount, previousGroup: nextGroup, result: response.output, coordinateText: "" },
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
    setCoordinateText("");
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
    {result?.group && <>
      <SolverResult title={`Press ${LABELS[result.group]}`} />
      {!isSolved && <SolverSection
        title="Twitch square coordinates"
        description="Enter every square in that group, for example A1 A2 B3."
      >
        <Input
          value={coordinateText}
          onChange={(event) => {
            const value = event.target.value.toUpperCase();
            setCoordinateText(value);
            if (bomb?.id && currentModule?.id) {
              updateModuleAfterSolve(
                bomb.id,
                currentModule.id,
                { whiteCount, previousGroup, result, coordinateText: value },
                result,
                isSolved,
              );
            }
          }}
          placeholder="A1 A2 B3"
          aria-label="Colored Squares coordinates"
          className="font-mono uppercase"
        />
      </SolverSection>}
    </>}
    {coordinateText.trim() && parseCoordinates(coordinateText).length > 0 && <TwitchCommandDisplay
      command={generateTwitchCommand({
        moduleType: ModuleType.COLORED_SQUARES,
        result: { coordinates: parseCoordinates(coordinateText) },
      })}
    />}
    <SolverInstructions>
      Start with the unique least-common color from the manual. After every press, enter the total number of white squares and the solver tells you the next group.
    </SolverInstructions>
  </SolverLayout>;
}
