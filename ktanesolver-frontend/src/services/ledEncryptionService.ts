import { solveModule } from "../lib/api";

export type LedColor = "RED" | "GREEN" | "BLUE" | "YELLOW" | "PURPLE" | "ORANGE";

export interface LedEncryptionInput {
  ledColor: LedColor;
  letters: string[];
  totalStages: number;
}

export interface LedEncryptionOutput {
  stage: number;
  correctButtons: string[];
  correctLetters: string[];
}

export const solveLedEncryption = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: LedEncryptionInput,
) => solveModule<LedEncryptionInput, { output: LedEncryptionOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
