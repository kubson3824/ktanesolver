import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import { solveRubiksCube, type RubiksCubeInput, type RubiksCubeOutput } from "../../services/rubiksCubeService";
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

const FACES = ["U", "L", "F", "D", "R", "B"] as const;
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
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ faceColors, result, twitchCommand }), [faceColors, result, twitchCommand]);

  const onRestoreState = useCallback((state: Partial<typeof moduleState> & { input?: Partial<RubiksCubeInput> }) => {
    const input = state.input ?? state;
    if (input.faceColors) setFaceColors(input.faceColors);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: RubiksCubeOutput) => {
    if (!solution?.moves) return;
    setResult(solution);
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
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

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

      {result && (
        <SolverSection title="Perform these moves" className="border-emerald-500/40">
          <ol className="flex flex-wrap justify-center gap-2">
            {result.moves.map((move, index) => (
              <li key={index} className="rounded-md border bg-muted/30 px-3 py-2 font-mono text-lg font-bold" aria-label={`Move ${index + 1}: ${move}`}>
                <span className="mr-1 text-xs font-normal text-muted-foreground">{index + 1}</span>
                {move.replace("'", "′")}
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
