import { solveModule } from "../lib/api";

export interface PokerInput {
  stage: 1 | 2 | 3;
  starterCard: string | null;
  opponentResponse: string | null;
  chipValue: number | null;
  finalCards: string[] | null;
}

export interface PokerOutput {
  stage: 1 | 2 | 3;
  call: string;
  truthOrBluff: string | null;
  cardPosition: number | null;
}

export const solvePoker = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: PokerInput,
) => solveModule<PokerInput, { output: PokerOutput; solved: boolean }>(roundId, bombId, moduleId, input);
