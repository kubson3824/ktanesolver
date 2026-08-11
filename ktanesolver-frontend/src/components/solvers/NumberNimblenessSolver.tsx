import { useState } from "react";
import { solveNumberNimbleness, type NumberNimblenessOutput } from "../../services/numberNimblenessService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";

const GAMES = ["Nagging Numbers", "Nebulous Numbers", "Nifty Numbers", "Nonary Numbers", "Nuisance Numbers"];

export default function NumberNimblenessSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState(1);
  const [miniGame, setMiniGame] = useState(GAMES[0]);
  const [display, setDisplay] = useState(0);
  const [digits, setDigits] = useState("");
  const [sequenceIndex, setSequenceIndex] = useState(1);
  const [result, setResult] = useState<NumberNimblenessOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();

  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const availableDigits = (digits.match(/\d/g) ?? []).map(Number);
    clearError(); setIsLoading(true);
    try {
      const response = await solveNumberNimbleness(round.id, bomb.id, currentModule.id, stage, miniGame, display, availableDigits, sequenceIndex);
      const command = generateTwitchCommand({ moduleType: ModuleType.NUMBER_NIMBLENESS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Number Nimbleness"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setStage(1); setMiniGame(GAMES[0]); setDisplay(0); setDigits(""); setSequenceIndex(1); setResult(null); setTwitchCommand(""); resetSolverState(); };
  const sequenced = miniGame === "Nebulous Numbers" || miniGame === "Nuisance Numbers";

  return <SolverLayout>
    <SolverSection title="Current live state">
      <label>Win number<select aria-label="Win number" value={stage} onChange={e => { setStage(Number(e.target.value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3">{[1, 2, 3].map(n => <option key={n}>{n}</option>)}</select></label>
      <label className="mt-3 block">Minigame<select aria-label="Minigame" value={miniGame} onChange={e => { setMiniGame(e.target.value); setSequenceIndex(1); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3">{GAMES.map(game => <option key={game}>{game}</option>)}</select></label>
      <label className="mt-3 block">Displayed digit<input aria-label="Displayed digit" type="number" min={0} max={9} value={display} onChange={e => { setDisplay(Number(e.target.value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3" /></label>
      <label className="mt-3 block">Remaining button digits<input aria-label="Remaining button digits" value={digits} onChange={e => { setDigits(e.target.value); changed(); }} placeholder="e.g. 0, 2, 4, 6" className="mt-1 h-11 w-full rounded border bg-background px-3" /></label>
      {sequenced && <label className="mt-3 block">Next sequence amount<input aria-label="Sequence index" type="number" min={1} value={sequenceIndex} onChange={e => { setSequenceIndex(Number(e.target.value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3" /></label>}
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press now" className="border-emerald-500/40"><p className="text-5xl font-bold">{result.press}</p><p className="mt-2 text-sm">Then remove {result.press} from the list.{sequenced && ` Set the next sequence amount to ${result.nextSequenceIndex}.`} Read the new display before solving again.</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Start gameplay after the warm-up, then solve one press from the current screen at a time. The Twitch command is conditional because execution is timer-sensitive and the upstream parser source is unavailable. After a strike, replace every field with the newly observed live state. Number Nimbleness is not a Souvenir candidate.</SolverInstructions>
  </SolverLayout>;
}
