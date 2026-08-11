import { useCallback, useMemo, useState } from "react";
import { BLACKJACK_STARTING_CARDS, solveBlackjack, type BlackjackOutput, type BlackjackStartingCard } from "../../services/blackjackService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const labels: Record<BlackjackStartingCard, string> = {
  ACE_OF_SPADES: "Ace of Spades", KING_OF_DIAMONDS: "King of Diamonds", TWO_OF_HEARTS: "Two of Hearts", TEN_OF_CLUBS: "Ten of Clubs",
};

export default function BlackjackSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [startingCard, setStartingCard] = useState<BlackjackStartingCard>("ACE_OF_SPADES");
  const [extraCardValue, setExtraCardValue] = useState<number | null>(null);
  const [result, setResult] = useState<BlackjackOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ startingCard, extraCardValue, result, twitchCommand }), [startingCard, extraCardValue, result, twitchCommand]);
  useSolverModulePersistence<typeof state, BlackjackOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (saved.startingCard) setStartingCard(saved.startingCard);
      if (saved.extraCardValue !== undefined) setExtraCardValue(saved.extraCardValue);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: BlackjackOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.BLACKJACK, result: solution })); }, []),
    currentModule, setIsSolved,
  });
  const changed = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveBlackjack(round.id, bomb.id, currentModule.id, startingCard, extraCardValue);
      const command = generateTwitchCommand({ moduleType: ModuleType.BLACKJACK, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { startingCard, extraCardValue, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Blackjack"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setStartingCard("ACE_OF_SPADES"); setExtraCardValue(null); setResult(null); setTwitchCommand(""); resetSolverState(); };

  return <SolverLayout>
    <SolverSection title="Visible cards" description="First find the bet. After placing it, enter the value of the extra face-up card and solve again.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Starting card<select aria-label="Starting card" value={startingCard} disabled={isLoading || isSolved} onChange={(event) => { setStartingCard(event.target.value as BlackjackStartingCard); setExtraCardValue(null); changed(); }} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3">{BLACKJACK_STARTING_CARDS.map((card) => <option key={card} value={card}>{labels[card]}</option>)}</select></label>
        <label className="text-sm font-medium">Extra card<select aria-label="Extra card value" value={extraCardValue ?? ""} disabled={isLoading || isSolved} onChange={(event) => { setExtraCardValue(event.target.value ? Number(event.target.value) : null); changed(); }} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3"><option value="">Not dealt yet</option><option value={1}>Ace</option>{[2,3,4,5,6].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText={extraCardValue === null ? "Find bet" : "Plan play"} />
    <ErrorAlert error={error} />
    {result && <SolverSection title={result.awaitingExtraCard ? "Place bet" : "Play"} className="border-emerald-500/40"><div className="grid gap-2 sm:grid-cols-3"><div><p className="text-sm text-muted-foreground">Hidden card</p><p className="font-semibold">{result.hiddenCard}</p></div><div><p className="text-sm text-muted-foreground">Bet</p><p className="font-semibold">${result.bet}</p></div>{result.playerTotal !== null && <div><p className="text-sm text-muted-foreground">Final hands</p><p className="font-semibold">You {result.playerTotal}{result.dealerTotal === null ? "" : ` — dealer ${result.dealerTotal}`}</p></div>}</div><p className="mt-3 text-lg font-bold capitalize">{result.actions.join(" → ")}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The module accepts only “bet 1”, “bet 10”, “bet 100”, “bet 250”, “hit”, “stand”, and “check”. Each hit/stand is emitted as its own Twitch command. A wrong check, bust, or losing stand restarts the module with a new starting card; press Reset and replace both observations.</SolverInstructions>
  </SolverLayout>;
}
