import { useState } from "react";
import { solveDaylightDirections, type DaylightDirectionsOutput } from "../../services/daylightDirectionsService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";

const directions = ["right", "down-right", "down", "down-left", "left", "up-left", "up", "up-right"];
export default function DaylightDirectionsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [activeSun, setActiveSun] = useState("left"), [arrowColor, setArrowColor] = useState("red"), [currentDirection, setCurrentDirection] = useState("right");
  const [result, setResult] = useState<DaylightDirectionsOutput | null>(null), [command, setCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, currentModule, round, markModuleSolved } = useSolver();
  const solve = async () => { if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information"); setIsLoading(true); clearError();
    try { const response = await solveDaylightDirections(round.id, bomb.id, currentModule.id, { activeSun, arrowColor, currentDirection }); setResult(response.output);
      const next = generateTwitchCommand({ moduleType: ModuleType.DAYLIGHT_DIRECTIONS, result: response.output }); setCommand(next); setIsSolved(response.solved); if (response.solved) markModuleSolved(bomb.id, currentModule.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Daylight Directions"); } finally { setIsLoading(false); } };
  return <SolverLayout><SolverSection title="Compass display"><div className="grid gap-3 sm:grid-cols-3">
    <label>Active sun<select value={activeSun} onChange={(e) => setActiveSun(e.target.value)} className="mt-1 block h-11 w-full rounded-md border bg-background px-3"><option>left</option><option>right</option></select></label>
    <label>Arrow color<select value={arrowColor} onChange={(e) => setArrowColor(e.target.value)} className="mt-1 block h-11 w-full rounded-md border bg-background px-3">{["red","blue","yellow","green","purple"].map(x => <option key={x}>{x}</option>)}</select></label>
    <label>Current direction<select value={currentDirection} onChange={(e) => setCurrentDirection(e.target.value)} className="mt-1 block h-11 w-full rounded-md border bg-background px-3">{directions.map(x => <option key={x}>{x}</option>)}</select></label>
  </div></SolverSection><SolverControls onSolve={solve} onReset={() => { setResult(null); setCommand(""); setIsSolved(false); }} isLoading={isLoading} isSolved={isSolved} /><ErrorAlert error={error} />
  {result && <SolverSection title="Rotate and submit"><p className="text-center text-xl font-bold">{result.turnCount ? `${result.turnDirection.toLowerCase()} × ${result.turnCount}` : "Submit now"} ({result.targetDirection.replace("_", " ")})</p></SolverSection>}{command && <TwitchCommandDisplay command={command} />}</SolverLayout>;
}
