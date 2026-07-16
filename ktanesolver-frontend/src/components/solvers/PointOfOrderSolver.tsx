import { useCallback, useMemo, useState } from "react";

import { solvePointOfOrder, type PointOfOrderOutput } from "../../services/pointOfOrderService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = [
  { code: "S", symbol: "♠", name: "spades" },
  { code: "H", symbol: "♥", name: "hearts" },
  { code: "C", symbol: "♣", name: "clubs" },
  { code: "D", symbol: "♦", name: "diamonds" },
];
const emptyCards = () => Array<string>(5).fill("");
const selectClass = "h-10 min-w-0 w-full rounded-md border border-input bg-background px-2 text-sm";

type PersistedState = {
  ranks?: string[];
  suits?: string[];
  cards?: string[];
  input?: { cards?: string[] };
  result?: PointOfOrderOutput | null;
  twitchCommand?: string;
};

function PlayingCard({ code }: { code: string }) {
  const suit = SUITS.find(({ code: value }) => value === code.at(-1));
  const rank = code.slice(0, -1);
  if (!suit) return null;
  const red = suit.code === "H" || suit.code === "D";
  return <div role="listitem" aria-label={`${rank} of ${suit.name}`} className={`flex h-20 w-14 flex-col justify-between rounded-md border bg-white p-2 font-bold shadow-sm ${red ? "text-red-600" : "text-slate-950"}`}>
    <span>{rank}</span><span className="self-end text-2xl" aria-hidden>{suit.symbol}</span>
  </div>;
}

export default function PointOfOrderSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [ranks, setRanks] = useState(emptyCards);
  const [suits, setSuits] = useState(emptyCards);
  const [result, setResult] = useState<PointOfOrderOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ ranks, suits, result, twitchCommand }), [ranks, suits, result, twitchCommand]);

  useSolverModulePersistence<PersistedState, PointOfOrderOutput>({
    state: moduleState,
    onRestoreState: useCallback((state) => {
      const cards = state.input?.cards ?? state.cards;
      if (state.ranks?.length === 5) setRanks(state.ranks);
      else if (cards?.length === 5) setRanks(cards.map((card) => card.slice(0, -1)));
      if (state.suits?.length === 5) setSuits(state.suits);
      else if (cards?.length === 5) setSuits(cards.map((card) => card.at(-1) ?? ""));
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: PointOfOrderOutput) => {
      if (!solution?.validCards?.length) return;
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.POINT_OF_ORDER, result: solution }));
    }, []),
    extractSolution: (raw) => raw && typeof raw === "object" && "validCards" in raw ? raw as PointOfOrderOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | null)?.solved),
    currentModule,
    setIsSolved,
  });

  const cards = ranks.map((rank, index) => rank + suits[index]);
  const validInput = ranks.every(Boolean) && suits.every(Boolean) && new Set(cards).size === 5;

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!validInput) return setError("Enter five different cards in play order");
    clearError(); setIsLoading(true);
    try {
      const response = await solvePointOfOrder(round.id, bomb.id, currentModule.id, { cards });
      const command = generateTwitchCommand({ moduleType: ModuleType.POINT_OF_ORDER, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ranks, suits, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Point of Order"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, cards, ranks, suits, validInput, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setRanks(emptyCards()); setSuits(emptyCards()); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Played pile" description="Enter the cards from the oldest card to the top (most recently played) card.">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground" aria-label="Play order from oldest to top">
        <span>Oldest</span><span className="h-px flex-1 bg-border" aria-hidden /><span aria-hidden>→</span><span>Top</span>
      </div>
      <ol className="grid gap-3 sm:grid-cols-5">
        {ranks.map((rank, index) => <li key={index} className="rounded-lg border border-border bg-muted/20 p-2">
          <div className="mb-2 flex min-h-5 items-center justify-between gap-2">
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">{index + 1}</span>
            {(index === 0 || index === 4) && <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{index === 0 ? "Oldest" : "Top"}</span>}
          </div>
          <div className="grid gap-2">
            <select value={rank} onChange={(event) => setRanks((current) => current.map((value, i) => i === index ? event.target.value : value))} disabled={isLoading || isSolved} aria-label={`Card ${index + 1} rank`} className={selectClass}>
              <option value="">Rank</option>{RANKS.map((value) => <option key={value}>{value}</option>)}
            </select>
            <select value={suits[index]} onChange={(event) => setSuits((current) => current.map((value, i) => i === index ? event.target.value : value))} disabled={isLoading || isSolved} aria-label={`Card ${index + 1} suit`} className={selectClass}>
              <option value="">Suit</option>{SUITS.map((suit) => <option key={suit.code} value={suit.code}>{suit.symbol}</option>)}
            </select>
          </div>
        </li>)}
      </ol>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!validInput} isLoading={isLoading} isSolved={isSolved} solveText="Find playable cards" />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Playable cards" description={`Rules ${result.activeRules.join(" and ")} are active. Reveal the hand and play its one matching card.`} className="border-emerald-500/40">
      <div className="flex flex-wrap justify-center gap-3" role="list" aria-label="Playable cards">
        {result.validCards.map((card) => <PlayingCard key={card} code={card} />)}
      </div>
    </SolverSection>}

    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Compute the valid cards before picking up the hand. Once revealed, Point of Order allows only five seconds to play.</SolverInstructions>
  </SolverLayout>;
}
