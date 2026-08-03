import { solveModule } from "../lib/api";

export interface SynonymsPair {
  okayWord: string;
  cancelWord: string;
}

export interface SynonymsInput {
  displayedNumber: number;
  pairs: SynonymsPair[];
}

export interface SynonymsOutput {
  targetWord: string;
  pairNumber: number;
  noMatch: boolean;
}

export const solveSynonyms = (roundId: string, bombId: string, moduleId: string, input: SynonymsInput) =>
  solveModule<SynonymsInput, { output: SynonymsOutput; solved: boolean }>(roundId, bombId, moduleId, input);
