import { useCallback, useMemo, useState } from "react";
import { solveLeftAndRight, type LeftAndRightOutput } from "../../services/leftAndRightService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function LeftAndRightSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [greenButtonSide, setGreenButtonSide] = useState("LEFT"), [result, setResult] = useState<LeftAndRightOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ greenButtonSide, result, twitchCommand }), [greenButtonSide, result, twitchCommand]);
  useSolverModulePersistence<typeof state, LeftAndRightOutput>({ state, onRestoreState: useCallback(saved => { if (saved.greenButtonSide) setGreenButtonSide(saved.greenButtonSide); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []), onRestoreSolution: useCallback((solution: LeftAndRightOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.LEFT_AND_RIGHT, result: solution })); }, []), currentModule, setIsSolved });
  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveLeftAndRight(round.id, bomb.id, currentModule.id, greenButtonSide);
      const command = generateTwitchCommand({ moduleType: ModuleType.LEFT_AND_RIGHT, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { greenButtonSide, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Left and Right"); }
    finally { setIsLoading(false); }
  };
  return <SolverLayout>
    <SolverSection title="Button positions"><label>Green button is on the<select aria-label="Green button side" value={greenButtonSide} onChange={event => { setGreenButtonSide(event.target.value); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3"><option value="LEFT">left</option><option value="RIGHT">right</option></select></label></SolverSection>
    <SolverControls onSolve={solve} onReset={() => { setGreenButtonSide("LEFT"); setResult(null); setTwitchCommand(""); resetSolverState(); }} isLoading={isLoading} isSolved={isSolved} solveText="Build press sequence" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press this physical sequence" className="border-emerald-500/40"><p className="font-mono text-3xl font-bold tracking-widest">{result.pressSequence.map(side => side[0]).join("")}</p><p className="mt-2 text-sm text-muted-foreground">Constructed {result.constructedNumber} → binary {result.initialBinarySequence}. Green switches after {result.greenSwitchAfter < 0 ? "never" : result.greenSwitchAfter}; blue after {result.blueSwitchAfter < 0 ? "never" : result.blueSwitchAfter}.</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The displayed sequence is already reorganized for every switch: press the physical left/right buttons exactly as shown. A wrong press strikes but does not consume input or reset progress. Left and Right is not a Souvenir candidate.</SolverInstructions>
  </SolverLayout>;
}
