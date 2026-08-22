import { useCallback, useMemo, useState } from "react";
import { BURGER_INGREDIENTS, solveBurgerAlarm, type BurgerAlarmOutput, type BurgerIngredient } from "../../services/burgerAlarmService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const POSITIONS = ["Top left","Top middle","Top right","Middle left","Center","Middle right","Bottom left","Bottom middle","Bottom right","Below bottom middle"];
const label = (ingredient: BurgerIngredient) => ingredient[0] + ingredient.slice(1).toLowerCase();

export default function BurgerAlarmSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [ingredients, setIngredients] = useState<BurgerIngredient[]>([...BURGER_INGREDIENTS]);
  const [displayedCode, setDisplayedCode] = useState("");
  const [orders, setOrders] = useState(["00","00","00","00","00"]);
  const [pcmciaPresent, setPcmciaPresent] = useState(false), [twoFactorPresent, setTwoFactorPresent] = useState(false);
  const [result, setResult] = useState<BurgerAlarmOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ ingredients, displayedCode, orders, pcmciaPresent, twoFactorPresent, result, twitchCommand }), [ingredients, displayedCode, orders, pcmciaPresent, twoFactorPresent, result, twitchCommand]);
  useSolverModulePersistence<typeof state, BurgerAlarmOutput>({ state, onRestoreState: useCallback(saved => { if (saved.ingredients) setIngredients(saved.ingredients); if (saved.displayedCode) setDisplayedCode(saved.displayedCode); if (saved.orders) setOrders(saved.orders); if (saved.pcmciaPresent !== undefined) setPcmciaPresent(saved.pcmciaPresent); if (saved.twoFactorPresent !== undefined) setTwoFactorPresent(saved.twoFactorPresent); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []), onRestoreSolution: useCallback((solution: BurgerAlarmOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.BURGER_ALARM, result: solution })); }, []), currentModule, setIsSolved });
  const clear = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveBurgerAlarm(round.id, bomb.id, currentModule.id, ingredients, displayedCode, orders, pcmciaPresent, twoFactorPresent);
      const command = generateTwitchCommand({ moduleType: ModuleType.BURGER_ALARM, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved); if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ingredients, displayedCode, orders, pcmciaPresent, twoFactorPresent, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Burger Alarm"); } finally { setIsLoading(false); }
  };
  const reset = () => { setIngredients([...BURGER_INGREDIENTS]); setDisplayedCode(""); setOrders(["00","00","00","00","00"]); setPcmciaPresent(false); setTwoFactorPresent(false); setResult(null); setTwitchCommand(""); resetSolverState(); };

  return <SolverLayout>
    <SolverSection title="Ingredient buttons"><div className="grid gap-2 sm:grid-cols-2">{ingredients.map((ingredient,index) => <label key={index}>{POSITIONS[index]}<select aria-label={`${POSITIONS[index]} ingredient`} value={ingredient} onChange={event => { setIngredients(current => current.map((value,position) => position === index ? event.target.value as BurgerIngredient : value)); clear(); }} className="mt-1 h-10 w-full rounded border bg-background px-2">{BURGER_INGREDIENTS.map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>)}</div></SolverSection>
    <SolverSection title="Code and orders"><label>Seven-digit code<input aria-label="Seven-digit code" value={displayedCode} maxLength={7} inputMode="numeric" onChange={event => { setDisplayedCode(event.target.value.replace(/\D/g, "").slice(0,7)); clear(); }} className="mt-1 h-11 w-full rounded border bg-background px-3 font-mono text-lg tracking-widest" /></label><div className="mt-3 grid grid-cols-5 gap-2">{orders.map((order,index) => <label key={index}>Order {index+1}<input aria-label={`Order ${index+1}`} value={order} maxLength={2} inputMode="numeric" onChange={event => { const value=event.target.value.replace(/\D/g, "").slice(0,2); setOrders(current => current.map((item,position) => position===index ? value : item)); clear(); }} className="mt-1 h-10 w-full rounded border bg-background px-2 font-mono" /></label>)}</div></SolverSection>
    <SolverSection title="Extra widgets"><div className="flex flex-wrap gap-5"><label><input type="checkbox" checked={pcmciaPresent} onChange={event => { setPcmciaPresent(event.target.checked); clear(); }} /> PCMCIA port present</label><label><input type="checkbox" checked={twoFactorPresent} onChange={event => { setTwoFactorPresent(event.target.checked); clear(); }} /> Two-factor widget present</label></div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Build burger" /><ErrorAlert error={error} />
    {result && <SolverSection title="Press in this order" className="border-emerald-500/40"><p className="text-lg">{result.pressSequence.map(label).join(" → ")}</p><p className="mt-2 text-sm text-muted-foreground">Table numbers: {result.tableNumbers.join(", ")} · Swap indexes: {result.swapIndexes.join(", ")}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Record the ten ingredients in physical button order. Press Order, cycle through and enter all five two-digit orders, then solve before the timer expires. The code digits and orders are retained for Souvenir.</SolverInstructions>
  </SolverLayout>;
}
