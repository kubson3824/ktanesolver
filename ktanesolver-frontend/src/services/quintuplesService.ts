import { solveModule } from "../lib/api";

export const QUINTUPLES_COLORS = ["RED", "BLUE", "ORANGE", "GREEN", "PINK"] as const;
export type QuintuplesColor = typeof QUINTUPLES_COLORS[number];
export type QuintuplesCell = { digit: number; color: QuintuplesColor };
export interface QuintuplesOutput { answer: string }

export const solveQuintuples = (roundId: string, bombId: string, moduleId: string, cells: QuintuplesCell[]): Promise<{output: QuintuplesOutput; solved: boolean}> =>
	solveModule(roundId, bombId, moduleId, { cells });
