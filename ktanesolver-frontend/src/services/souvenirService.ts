import { solveModule } from "../lib/api";

export interface SouvenirInput {
  sourceModuleId: string;
  question: string;
  answers?: string[];
  finalQuestion: boolean;
}

export interface SouvenirOutput {
  answer: string;
  answerIndex?: number | null;
}

export type SouvenirSolveResponse =
  | { output: SouvenirOutput; solved: boolean; reason?: never }
  | { output?: never; solved?: never; reason: string };

export const solveSouvenir = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: SouvenirInput,
) => solveModule<SouvenirInput, SouvenirSolveResponse>(
  roundId, bombId, moduleId, input,
);
