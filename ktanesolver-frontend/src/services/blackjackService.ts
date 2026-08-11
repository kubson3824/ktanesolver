import { solveModule } from "../lib/api";

export const BLACKJACK_STARTING_CARDS = ["ACE_OF_SPADES", "KING_OF_DIAMONDS", "TWO_OF_HEARTS", "TEN_OF_CLUBS"] as const;
export type BlackjackStartingCard = typeof BLACKJACK_STARTING_CARDS[number];
export interface BlackjackOutput {
  hiddenCard: string;
  bet: number;
  actions: string[];
  playerTotal: number | null;
  dealerTotal: number | null;
  dealOrder: number | null;
  awaitingExtraCard: boolean;
}
export const solveBlackjack = (
  roundId: string, bombId: string, moduleId: string, startingCard: BlackjackStartingCard, extraCardValue: number | null,
): Promise<{ output: BlackjackOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { startingCard, extraCardValue });
