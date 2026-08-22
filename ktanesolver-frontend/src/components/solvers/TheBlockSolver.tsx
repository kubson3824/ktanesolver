import { useState } from "react";
import { solveTheBlock, type TheBlockOutput } from "../../services/theBlockService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";
const choices = ["red","blue","green","yellow"];
export default function TheBlockSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [sideColors, setSideColors] = useState(["red","blue","green","yellow","red","blue"]), [result, setResult] = useState<TheBlockOutput | null>(null), [command, setCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, currentModule, round, markModuleSolved } = useSolver();
  const solve = async () => { if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information"); setIsLoading(true); clearError();
    try { const response = await solveTheBlock(round.id, bomb.id, currentModule.id, { sideColors }); setResult(response.output); const next = generateTwitchCommand({ moduleType: ModuleType.THE_BLOCK, result: response.output }); setCommand(next); setIsSolved(response.solved); if (response.solved) markModuleSolved(bomb.id, currentModule.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Block"); } finally { setIsLoading(false); } };
  return <SolverLayout><SolverSection title="Six sides in net order"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{sideColors.map((color, i) => <label key={i}>Side {i + 1}<select value={color} onChange={(e) => setSideColors(values => values.map((value, j) => i === j ? e.target.value : value))} className="mt-1 block h-11 w-full rounded-md border bg-background px-3">{choices.map(x => <option key={x}>{x}</option>)}</select></label>)}</div></SolverSection>
    <SolverControls onSolve={solve} onReset={() => { setResult(null); setCommand(""); setIsSolved(false); }} isLoading={isLoading} isSolved={isSolved} /><ErrorAlert error={error} />{result && <SolverSection title={`Rule ${result.rule}`}><p className="text-center text-2xl font-bold">{result.presses.join(" → ")}</p></SolverSection>}{command && <TwitchCommandDisplay command={command} />}</SolverLayout>;
}
