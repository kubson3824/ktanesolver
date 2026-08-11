import { solveModule } from "../lib/api";
export const BENEDICT_LEFT_LISTS = ["Bene", "Bumble", "Burger", "Bomba", "Bunsen"] as const;
export const BENEDICT_RIGHT_LISTS = ["Cumber", "Coddle", "Crumple", "Call", "Cabbage"] as const;
export const BENEDICT_LEFT_PREFIXES = [...BENEDICT_LEFT_LISTS, "Broccoli", "Buffalo", "Syphilis", "Cadbury"] as const;
export const BENEDICT_RIGHT_PREFIXES = [...BENEDICT_RIGHT_LISTS, "Bonaparte", "Oxfordshire", "Talisman", "Lingerie"] as const;
export interface BenedictCumberbatchOutput { leftIndex: number; rightIndex: number; leftSuffix: string; rightSuffix: string; forename: string; surname: string }
export const solveBenedictCumberbatch = (roundId: string, bombId: string, moduleId: string, leftPrefix: string, leftList: string, rightPrefix: string, rightList: string): Promise<{ output: BenedictCumberbatchOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { leftPrefix, leftList, rightPrefix, rightList });
