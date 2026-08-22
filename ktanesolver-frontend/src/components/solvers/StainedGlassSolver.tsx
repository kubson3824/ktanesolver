import { useState } from "react";
import { solveStainedGlass, type StainedGlassColor, type StainedGlassOutput } from "../../services/stainedGlassService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";

const rowLengths = [1,2,3,4,5,4,3,2,1];
const colors: StainedGlassColor[] = ["ICE","MALACHITE","AMBER","AMETHYST","ROSE","AUREOLIN"];

export default function StainedGlassSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [panes, setPanes] = useState<StainedGlassColor[]>(Array(25).fill("ICE")), [result, setResult] = useState<StainedGlassOutput | null>(null), [command, setCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, currentModule, round, markModuleSolved } = useSolver();
  const solve = async () => { if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information"); setIsLoading(true); clearError(); try { const response = await solveStainedGlass(round.id, bomb.id, currentModule.id, { paneColors: panes }); setResult(response.output); setCommand(generateTwitchCommand({ moduleType: ModuleType.STAINED_GLASS, result: response.output })); setIsSolved(response.solved); if (response.solved) markModuleSolved(bomb.id, currentModule.id); } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Stained Glass"); } finally { setIsLoading(false); } };
  let offset = 0;
  return <SolverLayout>
    <SolverSection title="Pane colors" description="Enter the nine diamond rows from top to bottom. Position 32 means row 3, pane 2 from the left.">
      <div className="space-y-1">{rowLengths.map((length, row) => { const start = offset; offset += length; return <div key={row} className="flex justify-center gap-1">{Array.from({length}, (_, column) => { const index = start + column; return <label key={column} className="w-20 text-center text-[10px]">{row+1}{column+1}<select aria-label={`Pane ${row+1}${column+1}`} value={panes[index]} onChange={event => setPanes(values => values.map((value, i) => i === index ? event.target.value as StainedGlassColor : value))} className="mt-0.5 block h-9 w-full rounded-md border bg-background px-1 text-[10px]">{colors.map(color => <option key={color}>{color}</option>)}</select></label>})}</div>})}</div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={() => { setPanes(Array(25).fill("ICE")); setResult(null); setCommand(""); setIsSolved(false); }} solveText="Find panes to smash" isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Smash these panes"><p className="text-center text-2xl font-bold">{result.smashPositions.length ? result.smashPositions.join(" · ") : "None"}</p></SolverSection>}
    {command && <TwitchCommandDisplay command={command} />}
  </SolverLayout>;
}
