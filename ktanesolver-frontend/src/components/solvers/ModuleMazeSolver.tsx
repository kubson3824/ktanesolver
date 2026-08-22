import { useCallback, useMemo, useState } from "react";
import { MODULE_MAZE_ICONS, solveModuleMaze, type ModuleMazeOutput } from "../../services/moduleMazeService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function ModuleMazeSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [startingIcon, setStartingIcon] = useState(MODULE_MAZE_ICONS[0]);
  const [destinationIcon, setDestinationIcon] = useState(MODULE_MAZE_ICONS.at(-1)!);
  const [result, setResult] = useState<ModuleMazeOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ startingIcon, destinationIcon, result, twitchCommand }), [startingIcon, destinationIcon, result, twitchCommand]);

  useSolverModulePersistence<typeof state, ModuleMazeOutput>({
    state,
    onRestoreState: useCallback(saved => {
      if (saved.startingIcon) setStartingIcon(saved.startingIcon);
      if (saved.destinationIcon) setDestinationIcon(saved.destinationIcon);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: ModuleMazeOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.MODULE_MAZE, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const changed = (setter: (value: string) => void, value: string) => {
    setter(value); setResult(null); setTwitchCommand(""); setIsSolved(false); clearError();
  };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveModuleMaze(round.id, bomb.id, currentModule.id, startingIcon, destinationIcon);
      const command = generateTwitchCommand({ moduleType: ModuleType.MODULE_MAZE, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { startingIcon, destinationIcon, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Module Maze"); }
    finally { setIsLoading(false); }
  };
  const reset = () => {
    setStartingIcon(MODULE_MAZE_ICONS[0]); setDestinationIcon(MODULE_MAZE_ICONS.at(-1)!);
    setResult(null); setTwitchCommand(""); resetSolverState();
  };

  return <SolverLayout>
    <SolverSection title="Module icons">
      <div className="grid gap-3 sm:grid-cols-2">
        <label>Starting icon<input aria-label="Starting icon" list="module-maze-icons" value={startingIcon} onChange={event => changed(setStartingIcon, event.target.value)} className="mt-1 h-11 w-full rounded border bg-background px-3" /></label>
        <label>Destination icon<input aria-label="Destination icon" list="module-maze-icons" value={destinationIcon} onChange={event => changed(setDestinationIcon, event.target.value)} className="mt-1 h-11 w-full rounded border bg-background px-3" /></label>
        <datalist id="module-maze-icons">{MODULE_MAZE_ICONS.map(icon => <option key={icon} value={icon} />)}</datalist>
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find shortest route" />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Route (${result.moveCount} moves)`} className="border-emerald-500/40">
      <p className="break-all font-mono text-lg tracking-widest">{result.route}</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The icon visible before pressing the display is the destination. Press the display once to reveal the starting icon, then enter both names. Follow the route and press the display again at the destination. The starting icon is retained for Souvenir.</SolverInstructions>
  </SolverLayout>;
}
