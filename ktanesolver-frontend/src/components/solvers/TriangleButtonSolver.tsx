import { useState } from "react";
import { solveTriangleButton, type TriangleButtonOutput } from "../../services/triangleButtonService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";

const colors = ["Red", "Green", "Purple", "Brown", "Orange", "Blue", "Grey", "Pink", "White"];
const directions = ["up", "up-right", "right", "down-right", "down", "down-left", "left", "up-left"];

export default function TriangleButtonSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [color, setColor] = useState("Red"); const [direction, setDirection] = useState("up");
  const [digit, setDigit] = useState(0); const [label, setLabel] = useState("");
  const [result, setResult] = useState<TriangleButtonOutput | null>(null); const [command, setCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, currentModule, round, markModuleSolved } = useSolver();
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    setIsLoading(true); clearError();
    try { const response = await solveTriangleButton(round.id, bomb.id, currentModule.id, { color, direction, digit, label });
      setResult(response.output); const next = generateTwitchCommand({ moduleType: ModuleType.THE_TRIANGLE_BUTTON, result: response.output }); setCommand(next);
      setIsSolved(response.solved); if (response.solved) markModuleSolved(bomb.id, currentModule.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Triangle Button"); } finally { setIsLoading(false); }
  };
  return <SolverLayout>
    <SolverSection title="Displayed button">
      <div className="grid gap-3 sm:grid-cols-2">
        <label>Color<select value={color} onChange={(e) => setColor(e.target.value)} className="mt-1 block h-11 w-full rounded-md border bg-background px-3">{colors.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>Direction<select value={direction} onChange={(e) => setDirection(e.target.value)} className="mt-1 block h-11 w-full rounded-md border bg-background px-3">{directions.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>Digit<input type="number" min={0} max={9} value={digit} onChange={(e) => setDigit(Number(e.target.value))} className="mt-1 block h-11 w-full rounded-md border bg-background px-3" /></label>
        <label>Label<input value={label} onChange={(e) => setLabel(e.target.value.toUpperCase())} className="mt-1 block h-11 w-full rounded-md border bg-background px-3" /></label>
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={() => { setResult(null); setCommand(""); setLabel(""); setIsSolved(false); }} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Required input"><p className="text-center text-xl font-bold">{result.action === "TAP" ? `Tap on ${result.targetDigit}` : `Hold on ${result.holdDigit}, release on ${result.releaseDigit}`}</p></SolverSection>}
    {command && <TwitchCommandDisplay command={command} />}
  </SolverLayout>;
}
