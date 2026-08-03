import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import { getRubiksCubeMoveDisplay, solveRubiksCube, type RubiksCubeInput, type RubiksCubeOutput } from "../../services/rubiksCubeService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
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
import { Button } from "../ui/button";

const FACES = ["U", "L", "F", "D", "R", "B"] as const;
const CUBE_NET = [
  { face: "U", position: "col-start-2 row-start-1" },
  { face: "L", position: "col-start-1 row-start-2" },
  { face: "F", position: "col-start-2 row-start-2" },
  { face: "R", position: "col-start-3 row-start-2" },
  { face: "B", position: "col-start-4 row-start-2" },
  { face: "D", position: "col-start-2 row-start-3" },
] as const;
const COLORS = ["YELLOW", "BLUE", "RED", "GREEN", "ORANGE", "WHITE"] as const;
const COLOR_CLASSES: Record<string, string> = {
  YELLOW: "bg-yellow-400",
  BLUE: "bg-blue-500",
  RED: "bg-red-500",
  GREEN: "bg-green-500",
  ORANGE: "bg-orange-500",
  WHITE: "bg-white",
};

export default function RubiksCubeSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [faceColors, setFaceColors] = useState<string[]>([...COLORS]);
  const [result, setResult] = useState<RubiksCubeOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ faceColors, result, twitchCommand }), [faceColors, result, twitchCommand]);

  const onRestoreState = useCallback((state: Partial<typeof moduleState> & { input?: Partial<RubiksCubeInput> }) => {
    const input = state.input ?? state;
    if (input.faceColors) setFaceColors(input.faceColors);
    if (state.result !== undefined) {
      setResult(state.result);
      setCurrentMoveIndex(0);
    }
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: RubiksCubeOutput) => {
    if (!solution?.moves) return;
    setResult(solution);
    setCurrentMoveIndex(0);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.RUBIKS_CUBE, result: solution }));
  }, []);

  useSolverModulePersistence<typeof moduleState, RubiksCubeOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as RubiksCubeOutput & { output?: RubiksCubeOutput };
      return value.output ?? value;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (new Set(faceColors).size !== COLORS.length) return setError("Use each cube color exactly once");
    clearError();
    setIsLoading(true);
    try {
      const input = { faceColors };
      const response = await solveRubiksCube(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.RUBIKS_CUBE, result: response.output });
      setResult(response.output);
      setCurrentMoveIndex(0);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Rubik's Cube");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, faceColors, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setFaceColors([...COLORS]);
    setResult(null);
    setCurrentMoveIndex(0);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  const currentMove = result?.moves[Math.min(currentMoveIndex, result.moves.length - 1)];
  const currentMoveDisplay = currentMove ? getRubiksCubeMoveDisplay(currentMove) : null;

  return (
    <SolverLayout>
      <SolverSection title="Center colors" description="Set the center sticker color for each face.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FACES.map((face, index) => (
            <label key={face} className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
              <span className="w-5 text-center font-mono text-base font-bold">{face}</span>
              <span className={cn("h-5 w-5 shrink-0 rounded-sm border border-black/40", COLOR_CLASSES[faceColors[index]])} aria-hidden />
              <select
                value={faceColors[index]}
                onChange={(event) => {
                  setFaceColors((current) => current.map((color, position) => position === index ? event.target.value : color));
                  clearError();
                }}
                disabled={isLoading || isSolved}
                aria-label={`${face} face color`}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
              >
                {COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
              </select>
            </label>
          ))}
        </div>
      </SolverSection>

      <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={new Set(faceColors).size !== COLORS.length} isLoading={isLoading} isSolved={isSolved} solveText="Get moves" />
      <ErrorAlert error={error} />

      {result && result.moves.length > 0 && currentMove && currentMoveDisplay && (
        <SolverSection
          title="Perform these moves"
          description={`Step ${currentMoveIndex + 1} of ${result.moves.length}: turn ${currentMoveDisplay.face} ${currentMoveDisplay.direction}, looking directly at that face.`}
          className="border-emerald-500/40"
        >
          <div className="mx-auto grid w-full max-w-sm grid-cols-4 grid-rows-3 gap-2" role="img" aria-label={`Cube net with the ${currentMoveDisplay.face} face highlighted for a ${currentMoveDisplay.direction} turn`}>
            {CUBE_NET.map(({ face, position }) => {
              const color = faceColors[FACES.indexOf(face)];
              const isActive = face === currentMoveDisplay.face;
              return (
                <div
                  key={face}
                  className={cn(
                    "relative flex aspect-square items-center justify-center rounded-md border-2 border-black/30",
                    position,
                    COLOR_CLASSES[color],
                    isActive ? "z-10 ring-4 ring-emerald-500 ring-offset-2 ring-offset-background" : "opacity-70",
                  )}
                  aria-label={`${face} face, ${color} center${isActive ? `, turn ${currentMoveDisplay.direction}` : ""}`}
                >
                  <span className="rounded bg-background/90 px-2 py-1 font-mono text-sm font-bold text-foreground shadow-sm">
                    {isActive && <span className="mr-1 text-lg" aria-hidden>{currentMoveDisplay.arrow}</span>}
                    {face}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Button variant="secondary" size="sm" disabled={currentMoveIndex === 0} onClick={() => setCurrentMoveIndex((index) => Math.max(0, index - 1))}>
              Previous
            </Button>
            <span className="text-center font-mono text-lg font-bold" aria-live="polite">
              {currentMove.replace("'", "′")}
            </span>
            <Button variant="secondary" size="sm" disabled={currentMoveIndex === result.moves.length - 1} onClick={() => setCurrentMoveIndex((index) => Math.min(result.moves.length - 1, index + 1))}>
              Next
            </Button>
          </div>

          <ol className="mt-4 flex flex-wrap justify-center gap-2">
            {result.moves.map((move, index) => (
              <li key={index}>
                <Button
                  type="button"
                  variant={index === currentMoveIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentMoveIndex(index)}
                  aria-label={`Show move ${index + 1}: ${move}`}
                  aria-current={index === currentMoveIndex ? "step" : undefined}
                  className="font-mono"
                >
                  <span className="text-xs font-normal opacity-70">{index + 1}</span>
                  {move.replace("'", "′")}
                </Button>
              </li>
            ))}
          </ol>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>F is the face with the Reset button. U, L, and F are visible from the module's direct view; rotate the cube to read D, R, and B.</SolverInstructions>
    </SolverLayout>
  );
}
