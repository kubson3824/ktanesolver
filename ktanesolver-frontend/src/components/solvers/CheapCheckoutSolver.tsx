import { useCallback, useMemo, useState } from "react";

import { solveCheapCheckout, type CheapCheckoutOutput } from "../../services/cheapCheckoutService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverResult,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const FIXED = [
  "Candy Canes", "Canola Oil", "Cereal", "Cheese", "Chocolate Bar", "Chocolate Milk", "Coffee Beans", "Cookies",
  "Deodorant", "Fruit Punch", "Grape Jelly", "Gum", "Honey", "Ketchup", "Lollipops", "Lotion", "Mayonnaise",
  "Mints", "Mustard", "Paper Towels", "Pasta Sauce", "Peanut Butter", "Potato Chips", "Shampoo", "Socks", "Soda",
  "Spaghetti", "Sugar", "Tea", "Tissues", "Toothpaste", "Water Bottles", "White Bread", "White Milk",
];
const WEIGHTED = ["Bananas", "Broccoli", "Chicken", "Grapefruit", "Lemons", "Lettuce", "Oranges", "Pork", "Potatoes", "Steak", "Tomatoes", "Turkey"];
const PRODUCTS = [...FIXED, ...WEIGHTED].sort();
const WEIGHTED_SET = new Set(WEIGHTED);
type UiItem = { name: string; weight: string };
const emptyItems = (): UiItem[] => Array.from({ length: 6 }, () => ({ name: "", weight: "" }));
const money = (value: number) => `$${value.toFixed(2)}`;

interface PersistedState {
  day?: string;
  items?: Array<{ name?: string; weight?: string | number | null }>;
  paidAmount?: string;
  waitingForSecondPayment?: boolean;
  result?: CheapCheckoutOutput | null;
  twitchCommand?: string;
}

export default function CheapCheckoutSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [day, setDay] = useState(DAYS[new Date().getDay()]);
  const [items, setItems] = useState<UiItem[]>(emptyItems);
  const [paidAmount, setPaidAmount] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [result, setResult] = useState<CheapCheckoutOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const completeCart = items.every((item) => item.name && (!WEIGHTED_SET.has(item.name) || item.weight))
    && new Set(items.map((item) => item.name)).size === 6;
  const validPaidAmount = paidAmount !== "" && Number(paidAmount) >= 0 && /^\d+(?:\.\d{1,2})?$/.test(paidAmount);
  const moduleState = useMemo(() => ({
    day, items, paidAmount, waitingForSecondPayment: waiting, result, twitchCommand,
  }), [day, items, paidAmount, waiting, result, twitchCommand]);

  useSolverModulePersistence<PersistedState, CheapCheckoutOutput>({
    state: moduleState,
    onRestoreState: useCallback((state: PersistedState) => {
      if (state.day) setDay(state.day);
      if (state.items?.length === 6) setItems(state.items.map((item) => ({
        name: item.name ?? "",
        weight: item.weight == null ? "" : String(item.weight),
      })));
      if (state.paidAmount !== undefined) setPaidAmount(state.paidAmount);
      if (state.waitingForSecondPayment !== undefined) setWaiting(state.waitingForSecondPayment);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: CheapCheckoutOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.CHEAP_CHECKOUT, result: solution }));
    }, []),
    extractSolution: (raw) => raw && typeof raw === "object" && "instruction" in raw ? raw as CheapCheckoutOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | null)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!waiting && !completeCart) return setError("Enter six different items and every displayed weight");
    if (!validPaidAmount) return setError("Enter a non-negative paid amount with at most two decimal places");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveCheapCheckout(round.id, bomb.id, currentModule.id, {
        day: waiting ? null : day,
        items: waiting ? null : items.map((item) => ({
          name: item.name,
          weight: WEIGHTED_SET.has(item.name) ? Number(item.weight) : null,
        })),
        paidAmount: Number(paidAmount),
      });
      const command = generateTwitchCommand({ moduleType: ModuleType.CHEAP_CHECKOUT, result: response.output });
      const nextPaidAmount = response.output.needsSecondPayment ? "" : paidAmount;
      setResult(response.output);
      setTwitchCommand(command);
      setWaiting(response.output.needsSecondPayment);
      setPaidAmount(nextPaidAmount);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        day, items, paidAmount: nextPaidAmount, waitingForSecondPayment: response.output.needsSecondPayment,
        result: response.output, twitchCommand: command,
      }, response.output, response.solved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Cheap Checkout");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, waiting, completeCart, validPaidAmount, day, items, paidAmount, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setDay(DAYS[new Date().getDay()]);
    setItems(emptyItems());
    setPaidAmount("");
    setWaiting(false);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    {!waiting && <>
      <SolverSection title="Activation day" description="Use the computer date from when this module activated.">
        <select value={day} onChange={(event) => setDay(event.target.value)} disabled={isLoading || isSolved} aria-label="Activation weekday" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {DAYS.map((value) => <option key={value} value={value}>{value[0] + value.slice(1).toLowerCase()}</option>)}
        </select>
      </SolverSection>
      <SolverSection title="Shopping list" description="Enter the items in the order shown; numbered sales use this order.">
        <div className="space-y-2">
          {items.map((item, index) => <div key={index} className="grid grid-cols-[2rem_minmax(0,1fr)_6rem] items-center gap-2">
            <span className="text-center text-sm font-semibold text-muted-foreground">{index + 1}</span>
            <select
              value={item.name}
              onChange={(event) => setItems((current) => current.map((value, position) => position === index ? {
                name: event.target.value,
                weight: WEIGHTED_SET.has(event.target.value) ? value.weight || "0.5" : "",
              } : value))}
              disabled={isLoading || isSolved}
              aria-label={`Item ${index + 1}`}
              className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select item</option>
              {PRODUCTS.map((name) => <option key={name} value={name}>{name}{WEIGHTED_SET.has(name) ? " (per lb)" : ""}</option>)}
            </select>
            {WEIGHTED_SET.has(item.name) ? <select
              value={item.weight}
              onChange={(event) => setItems((current) => current.map((value, position) => position === index ? { ...value, weight: event.target.value } : value))}
              disabled={isLoading || isSolved}
              aria-label={`Weight for item ${index + 1}`}
              className="h-10 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="0.5">0.5 lb</option><option value="1">1 lb</option><option value="1.5">1.5 lb</option>
            </select> : <span className="text-center text-xs text-muted-foreground">fixed</span>}
          </div>)}
        </div>
      </SolverSection>
    </>}

    <SolverSection title={waiting ? "Second paid amount" : "Paid amount"} description={waiting ? "Enter the new amount after the customer returns." : "Enter the amount shown above the shopping list."}>
      <Input value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} inputMode="decimal" placeholder="25.00" aria-label={waiting ? "Second paid amount" : "Paid amount"} disabled={isLoading || isSolved} className="mx-auto w-40 text-center font-mono text-lg" />
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!validPaidAmount || (!waiting && !completeCart)} solveText={waiting ? "Calculate change" : "Calculate"} />
    <ErrorAlert error={error} />
    {result && <SolverResult variant={result.needsSecondPayment ? "info" : "success"} title={result.needsSecondPayment ? "Customer underpaid" : `Return ${money(result.change)}`} description={`Cart total: ${money(result.total)}\n${result.instruction}`} />}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Round each weighted price first, then apply and round the weekday sale. If the first payment is short, submit zero change and enter the replacement amount.</SolverInstructions>
  </SolverLayout>;
}
