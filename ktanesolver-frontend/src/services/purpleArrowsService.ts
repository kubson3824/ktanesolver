import { solveModule } from "../lib/api";
export interface PurpleArrowsInput { displayedLetter: string; scrambledWord: string; reset: boolean }
export interface PurpleArrowsOutput { action: string; targetWord: string; remainingCandidates: number; identified: boolean; submit: boolean }
export const solvePurpleArrows = (roundId: string, bombId: string, moduleId: string, input: PurpleArrowsInput) => solveModule<PurpleArrowsInput, { output: PurpleArrowsOutput; solved: boolean }>(roundId, bombId, moduleId, input);
