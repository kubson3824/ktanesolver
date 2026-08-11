import { useState } from "react";
import { solvePayRespects, type PayRespectsOutput } from "../../services/payRespectsService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";

export default function PayRespectsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [active, setActive] = useState(false);
  const [result, setResult] = useState<PayRespectsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, setIsLoading, setError, clearError, reset: resetSolverState, currentModule, round } = useSolver();
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solvePayRespects(round.id, bomb.id, currentModule.id, active);
      setResult(response.output);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.PAY_RESPECTS, result: response.output }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Pay Respects"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setActive(false); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Needy state"><label className="flex items-center gap-3"><input type="checkbox" checked={active} onChange={e => { setActive(e.target.checked); setResult(null); setTwitchCommand(""); clearError(); }} />The 30-second timer is active now</label></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={false} solveText="Pay respects" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Act now" className="border-emerald-500/40"><p className="text-xl font-bold">{result.action}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The official Twitch command dynamically presses F until the active timer reaches 30 seconds. If the timer expires, the needy strikes and later asks again. Needy modules do not produce Souvenir questions.</SolverInstructions>
  </SolverLayout>;
}
