import { useCallback, useMemo, useState } from "react";
import { solveLabyrinth, type LabyrinthOutput } from "../../services/labyrinthService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const COORDINATES = Array.from({ length: 42 }, (_, index) => `${String.fromCharCode(65 + index % 6)}${Math.floor(index / 6) + 1}`).filter(coordinate => coordinate !== "F1");
const labels: Record<string, string> = { UP: "↑", LEFT: "←", RIGHT: "→", DOWN: "↓" };

export default function LabyrinthSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [layer, setLayer] = useState(1), [current, setCurrent] = useState("A1"), [portal1, setPortal1] = useState("A2"), [portal2, setPortal2] = useState("F2");
  const [result, setResult] = useState<LabyrinthOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ layer, current, portal1, portal2, result, twitchCommand }), [layer, current, portal1, portal2, result, twitchCommand]);
  useSolverModulePersistence<typeof state, LabyrinthOutput>({
    state,
    onRestoreState: useCallback(saved => { if (saved.layer) setLayer(saved.layer); if (saved.current) setCurrent(saved.current); if (saved.portal1) setPortal1(saved.portal1); if (saved.portal2) setPortal2(saved.portal2); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: LabyrinthOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.THE_LABYRINTH, result: solution })); }, []),
    currentModule, setIsSolved,
  });
  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveLabyrinth(round.id, bomb.id, currentModule.id, layer, current, portal1, portal2);
      const command = generateTwitchCommand({ moduleType: ModuleType.THE_LABYRINTH, result: response.output });
      const destination = response.output.steps.at(-1)?.destination ?? current;
      const nextPortal1 = COORDINATES.find(coordinate => coordinate !== destination) ?? "A1";
      const nextPortal2 = [...COORDINATES].reverse().find(coordinate => coordinate !== destination && coordinate !== nextPortal1) ?? "F7";
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      else { setLayer(response.output.nextLayer); setCurrent(destination); setPortal1(nextPortal1); setPortal2(nextPortal2); }
      updateModuleAfterSolve(bomb.id, currentModule.id, { layer: response.solved ? layer : response.output.nextLayer, current: destination, portal1: response.solved ? portal1 : nextPortal1, portal2: response.solved ? portal2 : nextPortal2, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Labyrinth"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setLayer(1); setCurrent("A1"); setPortal1("A2"); setPortal2("F2"); setResult(null); setTwitchCommand(""); resetSolverState(); };
  const coordinateSelect = (label: string, value: string, setValue: (value: string) => void) => <label>{label}<select aria-label={label} value={value} onChange={event => { setValue(event.target.value); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3">{COORDINATES.map(coordinate => <option key={coordinate}>{coordinate}</option>)}</select></label>;
  return <SolverLayout>
    <SolverSection title={`Layer ${layer} ascent`} description="Enter the green location and both visible orange portals.">
      <div className="grid grid-cols-3 gap-3">{coordinateSelect("Current", current, setCurrent)}{coordinateSelect("Portal 1", portal1, setPortal1)}{coordinateSelect("Portal 2", portal2, setPortal2)}</div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText={`Route layer ${layer}`} />
    <ErrorAlert error={error} />
    {result && <SolverSection title={result.steps.length === 1 ? "Route to the next layer" : "Complete route through the descent"} className="border-emerald-500/40">
      <div className="space-y-3">{result.steps.map(step => <div key={`${step.phase}-${step.layer}`}><p className="font-semibold">Layer {step.layer} {step.phase.toLowerCase()}: {step.start} → {step.destination}</p><p className="text-3xl tracking-widest">{step.directions.map(direction => labels[direction]).join(" ")}</p></div>)}</div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Use the default five manual mazes. Run each ascent route before entering the newly visible portals. After layer 5, the solver appends the four descent routes from the remembered portal pairs. If a move strikes or the module resets, press Reset and start again at layer 1. Souvenir records both portal locations on every layer.</SolverInstructions>
  </SolverLayout>;
}
