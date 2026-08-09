import { useCallback, useMemo, useState } from "react";
import {
  MAZE_SCRAMBLER_POSITIONS, solveMazeScrambler,
  type MazeScramblerInput, type MazeScramblerOutput,
} from "../../services/mazeScramblerService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

type SavedState = Partial<MazeScramblerInput> & {
  input?: Partial<MazeScramblerInput>;
  result?: MazeScramblerOutput | null;
  twitchCommand?: string;
};

const positionOptions = MAZE_SCRAMBLER_POSITIONS.map((label, index) => ({ label, value: index + 1 }));

export default function MazeScramblerSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [startPosition, setStartPosition] = useState(1);
  const [goalPosition, setGoalPosition] = useState(9);
  const [mazeMarkings, setMazeMarkings] = useState([2, 7]);
  const [result, setResult] = useState<MazeScramblerOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ startPosition, goalPosition, mazeMarkings, result, twitchCommand }),
    [startPosition, goalPosition, mazeMarkings, result, twitchCommand]);

  useSolverModulePersistence<SavedState, MazeScramblerOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      const input = saved.input ?? saved;
      if (input.startPosition) setStartPosition(input.startPosition);
      if (input.goalPosition) setGoalPosition(input.goalPosition);
      if (input.mazeMarkings?.length === 2) setMazeMarkings(input.mazeMarkings);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: MazeScramblerOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.MAZE_SCRAMBLER, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const clearResult = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const input: MazeScramblerInput = { startPosition, goalPosition, mazeMarkings };
    clearError(); setIsLoading(true);
    try {
      const response = await solveMazeScrambler(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.MAZE_SCRAMBLER, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Maze Scrambler"); }
    finally { setIsLoading(false); }
  };

  const reset = () => {
    setStartPosition(1); setGoalPosition(9); setMazeMarkings([2, 7]);
    setResult(null); setTwitchCommand(""); resetSolverState();
  };
  const select = (label: string, value: number, change: (next: number) => void) => <label className="block text-sm font-medium">
    {label}
    <select aria-label={label} value={value} onChange={(event) => { change(Number(event.target.value)); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
      {positionOptions.map((position) => <option key={position.value} value={position.value}>{position.value}. {position.label}</option>)}
    </select>
  </label>;

  return <SolverLayout>
    <SolverSection title="LED positions" description="Number the 3×3 grid left-to-right, top-to-bottom. Green/orange LEDs may combine a colored endpoint with a yellow marking.">
      <div className="grid gap-3 sm:grid-cols-2">
        {select("Blue starting position", startPosition, setStartPosition)}
        {select("Red goal position", goalPosition, setGoalPosition)}
        {select("First yellow marking", mazeMarkings[0], (value) => setMazeMarkings((current) => [value, current[1]]))}
        {select("Second yellow marking", mazeMarkings[1], (value) => setMazeMarkings((current) => [current[0], value]))}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find button sequence" />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Maze ${result.maze} route`} className="border-emerald-500/40">
      <p className="text-sm">Press <strong>{result.presses.join(" → ")}</strong></p>
      <p className="mt-2 text-sm text-muted-foreground">Moves: {result.moves.join(" ")}</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The generated command resets the module first, then enters a route valid from stage 1. Re-enter all four observed positions if a strike or physical reset changes the module.</SolverInstructions>
  </SolverLayout>;
}
