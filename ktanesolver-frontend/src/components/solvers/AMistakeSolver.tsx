import { useState } from "react";
import { solveAMistake, type AMistakeOutput } from "../../services/aMistakeService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";

export default function AMistakeSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState(1), [result, setResult] = useState<AMistakeOutput | null>(null), [command, setCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, currentModule, round, markModuleSolved } = useSolver();
  const solve = async () => { if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information"); setIsLoading(true); clearError();
    try { const response = await solveAMistake(round.id, bomb.id, currentModule.id); setResult(response.output); setStage(response.output.nextStage); const next = generateTwitchCommand({ moduleType: ModuleType.A_MISTAKE, result: response.output }); setCommand(next); setIsSolved(response.solved); if (response.solved) markModuleSolved(bomb.id, currentModule.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve A Mistake"); } finally { setIsLoading(false); } };
  return <SolverLayout><SolverSection title={`Touch ${stage} of 3`} description="Request each instruction immediately before making that touch.">{result && <p className="text-center text-xl font-bold">{result.timing}</p>}</SolverSection>
    <SolverControls onSolve={solve} onReset={() => { setResult(null); setCommand(""); setIsSolved(false); }} solveText={stage === 3 ? "Get final touch" : "Get next touch"} isLoading={isLoading} isSolved={isSolved} /><ErrorAlert error={error} />{command && <TwitchCommandDisplay command={command} />}</SolverLayout>;
}
