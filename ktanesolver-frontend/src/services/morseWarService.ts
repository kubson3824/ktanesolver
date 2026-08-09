import { solveModule } from "../lib/api";

export const MORSE_WAR_PATTERNS = ["1100", "1010", "1001", "0110", "0101", "0011"] as const;
export const MORSE_WAR_CODES = [
  "ABR", "RBS", "SVR", "ZUX", "ZAQ", "MOI", "OPA", "VZQ",
  "XRP", "OLL", "AIR", "RHG", "MJN", "VTT", "XZS", "SUN",
] as const;
export type MorseWarPattern = typeof MORSE_WAR_PATTERNS[number];
export type MorseWarCode = typeof MORSE_WAR_CODES[number];

export interface MorseWarInput {
  topRow: MorseWarPattern;
  middleRow: MorseWarPattern;
  bottomRow: MorseWarPattern;
  morseCode: MorseWarCode;
}

export interface MorseWarOutput {
  tableNumber: number;
  presses: string[];
}

export const solveMorseWar = (
  roundId: string, bombId: string, moduleId: string, input: MorseWarInput,
): Promise<{ output: MorseWarOutput; solved: boolean }> =>
  solveModule<MorseWarInput, { output: MorseWarOutput; solved: boolean }>(roundId, bombId, moduleId, input);
