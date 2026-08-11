import { solveModule } from "../lib/api";

export const PARTY_TIME_SPACE_TYPES = ["NORMAL", "D_BATTERY", "AA_BATTERY", "INDICATOR", "WATER", "FIRE"] as const;
export type PartyTimeSpaceType = "START" | typeof PARTY_TIME_SPACE_TYPES[number] | "GOAL";
export interface PartyTimeOutput { dieSpaces: number[]; pressSpaces: number[]; actions: string[] }
export const solvePartyTime = (
  roundId: string, bombId: string, moduleId: string, spaces: PartyTimeSpaceType[],
): Promise<{ output: PartyTimeOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { spaces });
