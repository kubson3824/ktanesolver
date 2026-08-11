import { solveModule } from "../lib/api";

export const REVERSE_MORSE_SYMBOLS = ["A", "L", "Q", "T", "X", "Z"] as const;
export const REVERSE_MORSE_COLORS = ["RED", "GREEN", "BLUE", "PURPLE", "YELLOW", "ORANGE"] as const;
export type ReverseMorseSymbol = typeof REVERSE_MORSE_SYMBOLS[number];
export type ReverseMorseColor = typeof REVERSE_MORSE_COLORS[number];
export interface ReverseMorseObservation { symbol: ReverseMorseSymbol; color: ReverseMorseColor }
export interface ReverseMorseInput {
  firstMessage: ReverseMorseObservation[];
  secondMessage: ReverseMorseObservation[];
  currentStage: number;
}
export interface ReverseMorseOutput {
  firstMessage: string;
  secondMessage: string;
  firstTransmission: string[];
  secondTransmission: string[];
  currentStage: number;
}
export const solveReverseMorse = (
  roundId: string, bombId: string, moduleId: string, input: ReverseMorseInput,
): Promise<{ output: ReverseMorseOutput; solved: boolean }> =>
  solveModule<ReverseMorseInput, { output: ReverseMorseOutput; solved: boolean }>(roundId, bombId, moduleId, input);
