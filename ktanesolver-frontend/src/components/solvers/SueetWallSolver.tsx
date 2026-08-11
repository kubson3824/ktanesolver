import { useCallback, useMemo, useState } from "react";
import { solveSueetWall, type SueetWallButton, type SueetWallOutput } from "../../services/sueetWallService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const SUITS = ["CLUBS", "HEARTS", "SPADES", "DIAMONDS"];
const fresh = (): SueetWallButton[] => Array.from({ length: 20 }, () => ({ suit: "CLUBS", number: 1, numberColor: "BLACK" }));
const coordinate = (index: number) => `${String.fromCharCode(65 + index % 4)}${Math.floor(index / 4) + 1}`;

export default function SueetWallSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [initialBombMinutes, setInitialBombMinutes] = useState(30), [buttons, setButtons] = useState(fresh);
  const [result, setResult] = useState<SueetWallOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(s => s.updateModuleAfterSolve);
  const state = useMemo(() => ({ initialBombMinutes, buttons, result, twitchCommand }), [initialBombMinutes, buttons, result, twitchCommand]);
  useSolverModulePersistence<typeof state, SueetWallOutput>({ state,
    onRestoreState: useCallback(s => { if (typeof s.initialBombMinutes === "number") setInitialBombMinutes(s.initialBombMinutes); if (Array.isArray(s.buttons) && s.buttons.length === 20) setButtons(s.buttons); if (s.result) setResult(s.result); if (s.twitchCommand) setTwitchCommand(s.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: SueetWallOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SUEET_WALL, result: solution })); }, []), currentModule, setIsSolved });
  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const update = (index: number, patch: Partial<SueetWallButton>) => { setButtons(current => current.map((button, i) => i === index ? { ...button, ...patch } : button)); changed(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveSueetWall(round.id, bomb.id, currentModule.id, initialBombMinutes, buttons);
      const command = generateTwitchCommand({ moduleType: ModuleType.SUEET_WALL, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved); markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { initialBombMinutes, buttons, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Sueet Wall"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setInitialBombMinutes(30); setButtons(fresh()); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Initial timer and 4×5 wall">
      <label>Initial bomb timer (whole minutes)<input aria-label="Initial bomb minutes" type="number" min={0} max={999} value={initialBombMinutes} onChange={e => { setInitialBombMinutes(Number(e.target.value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3" /></label>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">{buttons.map((button, index) => <div key={index} className="grid grid-cols-[2.5rem_1fr_5rem_6rem] items-center gap-2"><strong>{coordinate(index)}</strong><select aria-label={`${coordinate(index)} suit`} value={button.suit} onChange={e => update(index, { suit: e.target.value })} className="h-10 rounded border bg-background px-2">{SUITS.map(suit => <option key={suit}>{suit}</option>)}</select><input aria-label={`${coordinate(index)} number`} type="number" min={1} max={100} value={button.number} onChange={e => update(index, { number: Number(e.target.value) })} className="h-10 rounded border bg-background px-2" /><select aria-label={`${coordinate(index)} number color`} value={button.numberColor} onChange={e => update(index, { numberColor: e.target.value })} className="h-10 rounded border bg-background px-2"><option>BLACK</option><option>RED</option></select></div>)}</div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press" className="border-emerald-500/40"><p className="text-3xl font-bold">{result.pressCoordinates.join(" ")}</p>{result.anyButtonAllowed && <p className="mt-2 text-sm">No button qualifies, so any one button is accepted; A1 is the canonical choice.</p>}</SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Enter rows 1–5 from left to right (A–D). Press every returned coordinate; their order is irrelevant. An incorrect press strikes but does not regenerate the wall. Sueet Wall is not a Souvenir candidate.</SolverInstructions>
  </SolverLayout>;
}
