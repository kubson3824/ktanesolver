import { solveModule } from "../lib/api";

export interface ChallengeAndContactOutput {
  stage: number;
  answer: string;
  decodedPrefix: string;
  displayedLetters: string[];
}

export const solveChallengeAndContact = (
  roundId: string, bombId: string, moduleId: string, stage: number, clue: string, displayedLetter: string,
): Promise<{ output: ChallengeAndContactOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { stage, clue, displayedLetter });
