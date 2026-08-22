import {solveModule} from "../lib/api";

export const MISORDERED_KEYS_COLORS = ["RED", "GREEN", "BLUE", "CYAN", "MAGENTA", "YELLOW"] as const;
export type MisorderedKeysColor = typeof MISORDERED_KEYS_COLORS[number];
export interface MisorderedKey { keyColor: MisorderedKeysColor; labelColor: MisorderedKeysColor; label: string }
export interface MisorderedKeysOutput { firstValues: number[]; secondValues: number[]; pressOrder: number[]; twitchCommand: string }

export const solveMisorderedKeys = (
  roundId: string, bombId: string, moduleId: string, keys: MisorderedKey[], highlightedPosition: number,
): Promise<{output: MisorderedKeysOutput; solved: boolean}> =>
  solveModule(roundId, bombId, moduleId, {keys, highlightedPosition});
