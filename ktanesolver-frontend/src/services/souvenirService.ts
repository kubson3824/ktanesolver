import { solveModule } from "../lib/api";

export interface SouvenirInput {
  sourceModuleId: string;
  question: string;
  answers: string[];
  finalQuestion: boolean;
}

export interface SouvenirOutput {
  answer: string;
  answerIndex: number;
}

export const solveSouvenir = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: SouvenirInput,
) => solveModule<SouvenirInput, { output: SouvenirOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
