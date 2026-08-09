import { solveModule } from "../lib/api";

export const NUMBER_CIPHER_LIGHTS = ["OFF", "BLUE", "GREEN", "RED"] as const;
export type NumberCipherLight = typeof NUMBER_CIPHER_LIGHTS[number];

export interface NumberCipherInput {
  digits: number[];
  lights: NumberCipherLight[];
}

export interface NumberCipherOutput {
  answer: number;
  rule: string;
}

export const solveNumberCipher = (
  roundId: string, bombId: string, moduleId: string, input: NumberCipherInput,
): Promise<{ output: NumberCipherOutput; solved: boolean }> =>
  solveModule<NumberCipherInput, { output: NumberCipherOutput; solved: boolean }>(roundId, bombId, moduleId, input);
