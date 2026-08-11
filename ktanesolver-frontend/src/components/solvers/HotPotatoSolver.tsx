import { useState } from "react";
import { solveHotPotato, type HotPotatoOutput } from "../../services/hotPotatoService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";

export default function HotPotatoSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [active, setActive] = useState(false), [bombHeld, setBombHeld] = useState(true), [result, setResult] = useState<HotPotatoOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, setIsLoading, setError, clearError, reset: resetSolverState, currentModule, round } = useSolver();
  const changed = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try { const response = await solveHotPotato(round.id, bomb.id, currentModule.id, active, bombHeld); setResult(response.output); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.HOT_POTATO, result: response.output })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Hot Potato"); } finally { setIsLoading(false); }
  };
  const reset = () => { setActive(false); setBombHeld(true); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Current physical state"><label className="flex items-center gap-3"><input type="checkbox" checked={active} onChange={e => { setActive(e.target.checked); changed(); }} />Hot Potato is active</label><label className="mt-3 flex items-center gap-3"><input type="checkbox" checked={bombHeld} onChange={e => { setBombHeld(e.target.checked); changed(); }} />The bomb is currently held</label></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={false} solveText="Check action" /><ErrorAlert error={error} />
    {result && <SolverSection title="Before the 15 seconds expire" className="border-emerald-500/40"><p className="text-3xl font-bold">{result.action === "DROP_BOMB" ? "Drop the bomb now" : "Keep the bomb dropped"}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Hot Potato passes the activation if the bomb is not held when the timer expires; otherwise it strikes. Twitch uses the global command !bomb drop. Needy modules do not produce Souvenir questions.</SolverInstructions>
  </SolverLayout>;
}
