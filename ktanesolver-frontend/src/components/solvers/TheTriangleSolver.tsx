import { useCallback, useMemo, useState } from "react";
import { solveTheTriangle, type TheTriangleOutput } from "../../services/theTriangleService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const POSITIONS = ["Middle (large)", "Top-left", "Bottom-left", "Bottom-right"];
const COLORS = ["BLUE", "GREEN", "RED", "YELLOW"];

export default function TheTriangleSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [rotation, setRotation] = useState("CW"), [artwork, setArtwork] = useState("PICASSO"), [letter, setLetter] = useState("T");
  const [colors, setColors] = useState([...COLORS]), [result, setResult] = useState<TheTriangleOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(s => s.updateModuleAfterSolve);
  const state = useMemo(() => ({ rotation, artwork, letter, colors, result, twitchCommand }), [rotation, artwork, letter, colors, result, twitchCommand]);
  useSolverModulePersistence<typeof state, TheTriangleOutput>({ state,
    onRestoreState: useCallback(s => { if (s.rotation) setRotation(s.rotation); if (s.artwork) setArtwork(s.artwork); if (s.letter) setLetter(s.letter); if (Array.isArray(s.colors)) setColors(s.colors); if (s.result) setResult(s.result); if (s.twitchCommand) setTwitchCommand(s.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: TheTriangleOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.THE_TRIANGLE, result: solution })); }, []), currentModule, setIsSolved });
  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveTheTriangle(round.id, bomb.id, currentModule.id, rotation, artwork, letter, colors);
      const command = generateTwitchCommand({ moduleType: ModuleType.THE_TRIANGLE, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { rotation, artwork, letter, colors, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Triangle"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setRotation("CW"); setArtwork("PICASSO"); setLetter("T"); setColors([...COLORS]); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Current regenerated state">
      <div className="grid gap-3 sm:grid-cols-3"><label>Rotation<select value={rotation} onChange={e => { setRotation(e.target.value); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3"><option>CW</option><option>CCW</option></select></label><label>Artwork<select value={artwork} onChange={e => { setArtwork(e.target.value); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3">{["PICASSO","COOL","CONCENTRIC"].map(x => <option key={x}>{x}</option>)}</select></label><label>Letter<select value={letter} onChange={e => { setLetter(e.target.value); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3">{["T","R","N","G"].map(x => <option key={x}>{x}</option>)}</select></label></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{POSITIONS.map((position, i) => <label key={position}>{position}<select aria-label={`${position} color`} value={colors[i]} onChange={e => { const next=[...colors]; next[i]=e.target.value; setColors(next); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3">{COLORS.map(color => <option key={color}>{color}</option>)}</select></label>)}</div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find triangle" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press" className="border-emerald-500/40"><p className="text-3xl font-bold">{result.position} — {result.color}</p><p className="mt-2 text-sm">Distinct physical triangles completed: {result.completedPositions.length}/4</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>After every press—correct or wrong—replace all visible inputs with the regenerated state. Correctly pressed physical positions remain completed, and a repeated position is allowed. The Triangle is not a Souvenir candidate.</SolverInstructions>
  </SolverLayout>;
}
