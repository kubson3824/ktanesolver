import { solveModule } from "../lib/api";

export const COLORED_KEYS_COLORS = ["red", "blue", "green", "yellow", "purple", "white"];
export interface ColoredKey { color: string; letter: string }
export interface ColoredKeysOutput { keyPosition: number; position: string; scores: number[] }
export const solveColoredKeys = (roundId: string, bombId: string, moduleId: string, displayedWord: string, displayedColor: string, keys: ColoredKey[]): Promise<{ output: ColoredKeysOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { displayedWord, displayedColor, keys });
