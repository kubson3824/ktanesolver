import { solveModule } from "../lib/api";

export const TASHA_COLORS = ["PINK", "GREEN", "YELLOW", "BLUE"] as const;
export type TashaColor = typeof TASHA_COLORS[number];
export interface TashaSquealsOutput { pressColors: TashaColor[]; stageSequences: TashaColor[][] }

export const solveTashaSqueals = (
  roundId: string, bombId: string, moduleId: string,
  top: TashaColor, right: TashaColor, bottom: TashaColor, left: TashaColor, flashedColors: TashaColor[],
): Promise<{ output: TashaSquealsOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { top, right, bottom, left, flashedColors });
