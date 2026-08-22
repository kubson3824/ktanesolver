import { solveModule } from "../lib/api";

export const BORDERED_KEYS_COLORS = ["RED", "GREEN", "BLUE", "CYAN", "MAGENTA", "YELLOW"] as const;
export type BorderedKeysColor = typeof BORDERED_KEYS_COLORS[number];

export interface BorderedKey {
  active: boolean;
  keyColor: BorderedKeysColor;
  labelColor: BorderedKeysColor;
  borderColor: BorderedKeysColor;
  label: number;
  display: number;
}

export interface BorderedKeysOutput {
  targetValue: number;
  decodedValues: number[];
  validPositions: number[];
  recommendedPosition: number;
  action: "PRESS" | "RESET";
  twitchCommand: string;
}

export const solveBorderedKeys = (
  roundId: string,
  bombId: string,
  moduleId: string,
  pressedBeforeReset: number,
  keys: BorderedKey[],
): Promise<{ output: BorderedKeysOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { pressedBeforeReset, keys });
