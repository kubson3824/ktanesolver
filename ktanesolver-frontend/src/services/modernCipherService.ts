import { solveModule } from "../lib/api";

export interface ModernCipherInput {
  ciphertext: string;
  strikesAtGeneration: number;
  solvedModulesAtGeneration: number;
}

export interface ModernCipherOutput {
  solution: string;
  stage: number;
  key: number;
  direction: "backward" | "forward";
}

export const solveModernCipher = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: ModernCipherInput,
) => solveModule<ModernCipherInput, { output: ModernCipherOutput; solved: boolean }>(
  roundId,
  bombId,
  moduleId,
  input,
);
