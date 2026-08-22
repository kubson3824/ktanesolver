import { useState } from "react";
import { solveTransmittedMorse, type TransmittedMorseOutput } from "../../services/transmittedMorseService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";
const colors = ["yellow","blue","red","green","pink","orange","white"];
export default function TransmittedMorseSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState(1), [receivedMessage, setReceivedMessage] = useState(""), [topLed, setTopLed] = useState("yellow"), [bottomLed, setBottomLed] = useState("yellow");
  const [result, setResult] = useState<TransmittedMorseOutput | null>(null), [command, setCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, currentModule, round, markModuleSolved } = useSolver();
  const solve = async () => { if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information"); setIsLoading(true); clearError();
    try { const response = await solveTransmittedMorse(round.id, bomb.id, currentModule.id, { receivedMessage, topLed, bottomLed }); setResult(response.output); setStage(response.output.nextStage); const next = generateTwitchCommand({ moduleType: ModuleType.TRANSMITTED_MORSE, result: response.output }); setCommand(next); setIsSolved(response.solved); if (response.solved) markModuleSolved(bomb.id, currentModule.id); else setReceivedMessage("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Transmitted Morse"); } finally { setIsLoading(false); } };
  return <SolverLayout><SolverSection title={`Stage ${stage} transmission`}><div className="grid gap-3 sm:grid-cols-3"><label>Received message<input value={receivedMessage} onChange={(e) => setReceivedMessage(e.target.value.toUpperCase())} className="mt-1 block h-11 w-full rounded-md border bg-background px-3" /></label>{[["Top LED",topLed,setTopLed],["Bottom LED",bottomLed,setBottomLed]].map(([label,value,setter]) => <label key={label as string}>{label as string}<select value={value as string} onChange={(e) => (setter as (value: string) => void)(e.target.value)} className="mt-1 block h-11 w-full rounded-md border bg-background px-3">{colors.map(color => <option key={color}>{color}</option>)}</select></label>)}</div></SolverSection>
    <SolverControls onSolve={solve} onReset={() => { setResult(null); setCommand(""); setIsSolved(false); }} solveText={stage === 2 ? "Solve module" : "Solve stage"} isLoading={isLoading} isSolved={isSolved} /><ErrorAlert error={error} />{result && <SolverSection title={`${result.effectiveMessage}${result.reversed ? " (reversed)" : ""}`}><p className="text-center font-mono text-lg">{result.entries.map(entry => `${entry.slider}:${entry.position}`).join(" → ")}</p></SolverSection>}{command && <TwitchCommandDisplay command={command} />}</SolverLayout>;
}
