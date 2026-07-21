import { useCallback, useMemo, useState } from "react";

import { solvePoker, type PokerInput, type PokerOutput } from "../../services/pokerService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const STARTERS = [
  { value: "ACE_OF_SPADES", label: "Ace of Spades", symbol: "A♠" },
  { value: "KING_OF_HEARTS", label: "King of Hearts", symbol: "K♥" },
  { value: "FIVE_OF_DIAMONDS", label: "Five of Diamonds", symbol: "5♦" },
  { value: "TWO_OF_CLUBS", label: "Two of Clubs", symbol: "2♣" },
] as const;
const RESPONSES = [
  { value: "TERRIBLE_PLAY", label: "Terrible play!" },
  { value: "AWFUL_PLAY", label: "Awful play!" },
  { value: "REALLY", label: "Really?" },
  { value: "REALLY_REALLY", label: "Really, really?" },
  { value: "SURE_ABOUT_THAT", label: "Sure about that?" },
  { value: "ARE_YOU_SURE", label: "Are you sure?" },
] as const;
const SUITS = [
  { value: "CLUB", label: "Clubs", symbol: "♣" },
  { value: "HEART", label: "Hearts", symbol: "♥" },
  { value: "SPADE", label: "Spades", symbol: "♠" },
  { value: "DIAMOND", label: "Diamonds", symbol: "♦" },
] as const;
const CALL_LABELS: Record<string, string> = {
  FOLD: "FOLD",
  CHECK: "CHECK",
  MIN_RAISE: "MIN RAISE",
  MAX_RAISE: "MAX RAISE",
  ALL_IN: "ALL-IN",
};
const emptyCards = () => Array<string>(4).fill("");
const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

type Stage = 1 | 2 | 3;
type PersistedState = {
  stage?: Stage;
  starterCard?: string;
  opponentResponse?: string;
  chipValue?: number;
  finalCards?: string[];
  call?: string;
  truthOrBluff?: string;
  result?: PokerOutput | null;
  twitchCommand?: string;
};

function outputTitle(output: PokerOutput) {
  if (output.stage === 1) return `Press ${CALL_LABELS[output.call] ?? output.call}`;
  if (output.stage === 2) return `Press ${output.truthOrBluff}`;
  return `Press card ${output.cardPosition}`;
}

function outputDescription(stage: Stage) {
  if (stage === 1) return "The opponent's response appears after this correct call.";
  if (stage === 2) return "The chip and four final-card suits appear after this answer.";
  return "Cards are numbered from left to right.";
}

export default function PokerSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState<Stage>(1);
  const [starterCard, setStarterCard] = useState("");
  const [opponentResponse, setOpponentResponse] = useState("");
  const [chipValue, setChipValue] = useState<number | null>(null);
  const [finalCards, setFinalCards] = useState(emptyCards);
  const [result, setResult] = useState<PokerOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({
    stage, starterCard, opponentResponse, chipValue: chipValue ?? undefined,
    finalCards, result, twitchCommand,
  }), [stage, starterCard, opponentResponse, chipValue, finalCards, result, twitchCommand]);

  useSolverModulePersistence<PersistedState, PokerOutput>({
    state: moduleState,
    onRestoreState: useCallback((state) => {
      if (state.starterCard !== undefined) setStarterCard(state.starterCard);
      if (state.opponentResponse !== undefined) setOpponentResponse(state.opponentResponse);
      if (state.chipValue !== undefined) setChipValue(state.chipValue);
      if (state.finalCards?.length === 4) setFinalCards(state.finalCards);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
      setStage(state.stage ?? (state.truthOrBluff ? 3 : state.call ? 2 : 1));
    }, []),
    onRestoreSolution: useCallback((solution: PokerOutput) => {
      if (![1, 2, 3].includes(solution?.stage)) return;
      setStage(solution.stage === 3 ? 3 : (solution.stage + 1) as Stage);
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.POKER, result: solution }));
    }, []),
    extractSolution: (raw) => raw && typeof raw === "object" && "stage" in raw && "call" in raw
      ? raw as PokerOutput
      : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | null)?.solved),
    currentModule,
    setIsSolved,
  });

  const validInput = stage === 1
    ? Boolean(starterCard)
    : stage === 2
      ? Boolean(opponentResponse)
      : chipValue !== null && finalCards.every(Boolean);

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!validInput) return setError(stage === 3 ? "Select the chip and all four suits" : "Select the displayed value");
    const input: PokerInput = stage === 1
      ? { stage, starterCard, opponentResponse: null, chipValue: null, finalCards: null }
      : stage === 2
        ? { stage, starterCard: null, opponentResponse, chipValue: null, finalCards: null }
        : { stage, starterCard: null, opponentResponse: null, chipValue, finalCards };
    clearError(); setIsLoading(true);
    try {
      const response = await solvePoker(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.POKER, result: response.output });
      const nextStage = response.output.stage === 3 ? 3 : (response.output.stage + 1) as Stage;
      setStage(nextStage); setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        stage: nextStage, starterCard, opponentResponse, chipValue, finalCards,
        result: response.output, twitchCommand: command,
      }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Poker"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, validInput, stage, starterCard, opponentResponse, chipValue, finalCards, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setStage(1); setStarterCard(""); setOpponentResponse(""); setChipValue(null); setFinalCards(emptyCards());
    setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <div className="grid grid-cols-3 gap-2" aria-label={`Poker stage ${stage} of 3`}>
      {["Call", "Response", "Bet"].map((label, index) => <div key={label} className={`rounded-md border px-2 py-1 text-center text-xs font-semibold ${stage === index + 1 ? "border-primary bg-primary/10 text-primary" : stage > index + 1 ? "border-emerald-500/40 text-emerald-600" : "text-muted-foreground"}`}>
        {index + 1}. {label}
      </div>)}
    </div>

    {stage === 1 && <SolverSection title="Starter card" description="Select the single face-up card.">
      <select value={starterCard} onChange={(event) => setStarterCard(event.target.value)} disabled={isLoading || isSolved} aria-label="Starter card" className={selectClass}>
        <option value="">Select the card</option>
        {STARTERS.map((card) => <option key={card.value} value={card.value}>{card.symbol} — {card.label}</option>)}
      </select>
    </SolverSection>}

    {stage === 2 && <SolverSection title="Opponent response" description="Enter the text revealed after making the call.">
      <select value={opponentResponse} onChange={(event) => setOpponentResponse(event.target.value)} disabled={isLoading || isSolved} aria-label="Opponent response" className={selectClass}>
        <option value="">Select the exact response</option>
        {RESPONSES.map((response) => <option key={response.value} value={response.value}>{response.label}</option>)}
      </select>
    </SolverSection>}

    {stage === 3 && <>
      <SolverSection title="Betting chip">
        <select value={chipValue ?? ""} onChange={(event) => setChipValue(event.target.value ? Number(event.target.value) : null)} disabled={isLoading || isSolved} aria-label="Betting chip" className={selectClass}>
          <option value="">Select the chip</option>
          {[25, 50, 100, 500].map((value) => <option key={value} value={value}>${value}</option>)}
        </select>
      </SolverSection>
      <SolverSection title="Final cards" description="Enter only the suit shown on each card, from left to right.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {finalCards.map((suit, index) => <label key={index} className="rounded-lg border bg-muted/20 p-2 text-center">
            <span className="mb-2 block text-xs font-semibold text-muted-foreground">Card {index + 1}</span>
            <select value={suit} onChange={(event) => setFinalCards((current) => current.map((value, position) => position === index ? event.target.value : value))} disabled={isLoading || isSolved} aria-label={`Card ${index + 1} suit`} className={selectClass}>
              <option value="">Suit</option>
              {SUITS.map((option) => <option key={option.value} value={option.value}>{option.symbol} {option.label}</option>)}
            </select>
          </label>)}
        </div>
      </SolverSection>
    </>}

    <SolverControls
      onSolve={solve}
      onReset={reset}
      isSolveDisabled={!validInput}
      isLoading={isLoading}
      isSolved={isSolved}
      solveText={stage === 1 ? "Find call" : stage === 2 ? "Check response" : "Choose card"}
    />
    <ErrorAlert error={error} />

    {result && <SolverSection title={outputTitle(result)} description={outputDescription(result.stage)} className="border-emerald-500/40">
      <div className="text-center text-2xl font-bold tracking-wide">
        {result.stage === 1 ? CALL_LABELS[result.call] ?? result.call : result.stage === 2 ? result.truthOrBluff : `CARD ${result.cardPosition}`}
      </div>
    </SolverSection>}

    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Complete each stage in order. A correct call reveals the response; a correct Truth/Bluff answer reveals the chip and four suits.</SolverInstructions>
  </SolverLayout>;
}
