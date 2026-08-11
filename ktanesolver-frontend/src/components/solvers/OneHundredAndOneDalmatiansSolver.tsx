import { useCallback, useMemo, useState } from "react";
import { solveOneHundredAndOneDalmatians, type OneHundredAndOneDalmatiansOutput } from "../../services/oneHundredAndOneDalmatiansService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { DALMATIAN_PATTERNS } from "./dalmatianPatterns";

const centerRadius = (index: number) => DALMATIAN_PATTERNS[index].circles.find(circle => circle.x === 0 && circle.y === 0)?.radius ?? 0;

export default function OneHundredAndOneDalmatiansSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [spotCount, setSpotCount] = useState(0);
  const [centerSize, setCenterSize] = useState(-1);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<OneHundredAndOneDalmatiansOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ selectedIndex, spotCount, centerSize, rotation, result, twitchCommand }), [selectedIndex, spotCount, centerSize, rotation, result, twitchCommand]);
  useSolverModulePersistence<typeof state, OneHundredAndOneDalmatiansOutput>({
    state,
    onRestoreState: useCallback(saved => {
      if (saved.selectedIndex !== undefined) setSelectedIndex(saved.selectedIndex);
      if (saved.spotCount !== undefined) setSpotCount(saved.spotCount);
      if (saved.centerSize !== undefined) setCenterSize(saved.centerSize);
      if (saved.rotation !== undefined) setRotation(saved.rotation);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: OneHundredAndOneDalmatiansOutput) => {
      setResult(solution);
      setSelectedIndex(solution.patternNumber - 1);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.ONE_HUNDRED_AND_ONE_DALMATIANS, result: solution }));
    }, []),
    currentModule, setIsSolved,
  });
  const changed = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const visible = DALMATIAN_PATTERNS.map((pattern, index) => ({ pattern, index })).filter(({ pattern, index }) =>
    (!spotCount || pattern.circles.length === spotCount) && (centerSize < 0 || centerRadius(index) === centerSize));
  const solve = async () => {
    if (selectedIndex === null) return setError("Select the matching fur pattern");
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveOneHundredAndOneDalmatians(round.id, bomb.id, currentModule.id, selectedIndex + 1);
      const command = generateTwitchCommand({ moduleType: ModuleType.ONE_HUNDRED_AND_ONE_DALMATIANS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { selectedIndex, spotCount, centerSize, rotation, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve 101 Dalmatians"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setSelectedIndex(null); setSpotCount(0); setCenterSize(-1); setRotation(0); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Match the fur pattern" description="Filter the catalogue, rotate it to match the module, then select the identical pattern.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Number of spots<select aria-label="Spot count" value={spotCount} onChange={event => setSpotCount(Number(event.target.value))} className="mt-1 h-11 w-full rounded border bg-background px-3"><option value={0}>Any</option><option value={3}>3</option><option value={4}>4</option></select></label>
        <label className="text-sm">Center spot size<select aria-label="Center spot size" value={centerSize} onChange={event => setCenterSize(Number(event.target.value))} className="mt-1 h-11 w-full rounded border bg-background px-3"><option value={-1}>Any</option><option value={0}>No center spot</option><option value={1}>Small</option><option value={2}>Medium</option><option value={3}>Large</option><option value={4}>Largest</option></select></label>
      </div>
      <label className="mt-3 block text-sm">Rotate catalogue: {rotation}°<input aria-label="Pattern rotation" type="range" min={0} max={359} value={rotation} onChange={event => setRotation(Number(event.target.value))} className="mt-1 w-full" /></label>
      <p className="mt-2 text-sm text-muted-foreground">{visible.length} matching patterns</p>
      <div className="mt-3 grid max-h-[32rem] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">{visible.map(({ pattern, index }) => <button key={pattern.name} type="button" onClick={() => { setSelectedIndex(index); changed(); }} aria-pressed={selectedIndex === index} className={`rounded border p-2 text-sm ${selectedIndex === index ? "border-primary bg-primary/10" : "hover:bg-muted"}`}>
        <svg viewBox={pattern.viewBox} className="mx-auto h-24 w-24 rounded bg-white" aria-label={`${pattern.name} fur pattern`}><g transform={`rotate(${rotation})`}>{pattern.circles.map((circle, circleIndex) => <circle key={circleIndex} cx={circle.x} cy={circle.y} r={circle.radius} fill="black" />)}</g></svg>
        <span className="mt-1 block font-medium">{pattern.name}</span>
      </button>)}</div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Submit this name" className="border-emerald-500/40"><p className="text-3xl font-bold">{result.name}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The module accepts the name regardless of capitalization. A wrong submission strikes but does not change the fur pattern, so keep the same observation and choose again. The catalogue follows the standard Rule Seed 1 manual.</SolverInstructions>
  </SolverLayout>;
}
