import { useCallback, useMemo, useState } from "react";
import { GROCERY_ITEMS, solveGroceryStore, type GroceryStoreOutput } from "../../services/groceryStoreService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function GroceryStoreSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [currentItem, setCurrentItem] = useState(GROCERY_ITEMS[0]), [resetCart, setResetCart] = useState(true);
  const [result, setResult] = useState<GroceryStoreOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ currentItem, resetCart, result, twitchCommand }), [currentItem, resetCart, result, twitchCommand]);
  useSolverModulePersistence<typeof state, GroceryStoreOutput>({ state, onRestoreState: useCallback(saved => { if (saved.currentItem) setCurrentItem(saved.currentItem); if (saved.resetCart !== undefined) setResetCart(saved.resetCart); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []), onRestoreSolution: useCallback((solution: GroceryStoreOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.GROCERY_STORE, result: solution })); }, []), currentModule, setIsSolved });
  const changed = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveGroceryStore(round.id, bomb.id, currentModule.id, currentItem, resetCart);
      const command = generateTwitchCommand({ moduleType: ModuleType.GROCERY_STORE, result: response.output });
      setResetCart(false); setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { currentItem, resetCart: false, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Grocery Store"); } finally { setIsLoading(false); }
  };
  const reset = () => { setCurrentItem(GROCERY_ITEMS[0]); setResetCart(true); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Current item"><label>Item shown<select aria-label="Current item" value={currentItem} onChange={event => { setCurrentItem(event.target.value); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-2">{GROCERY_ITEMS.map(item => <option key={item}>{item}</option>)}</select></label><label className="mt-3 block"><input type="checkbox" checked={resetCart} onChange={event => { setResetCart(event.target.checked); changed(); }} /> This is the first item, or the cart reset after a strike</label></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Decide" /><ErrorAlert error={error} />
    {result && <SolverSection title={result.action === "ADD" ? "Add item to cart" : "Pay and leave"} className="border-emerald-500/40"><p>{result.item}: {money(result.itemPriceCents)}</p><p>Cart: {money(result.totalBeforeCents)} → {money(result.totalAfterCents)} / {money(result.budgetCents)}</p>{result.cartItems.length > 0 && <p className="mt-2 text-sm text-muted-foreground">Added: {result.cartItems.join(", ")}</p>}</SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>For each displayed item, ask the solver and perform the result. After adding, select the new item and decide again. If the module strikes, check the reset box for the next item; that item becomes the new Souvenir answer.</SolverInstructions>
  </SolverLayout>;
}
