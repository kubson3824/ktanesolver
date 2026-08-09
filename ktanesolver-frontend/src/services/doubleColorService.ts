import { solveModule } from "../lib/api";

export const DOUBLE_COLOR_COLORS = ["GREEN", "BLUE", "RED", "PINK", "YELLOW"] as const;
export type DoubleColorColor = typeof DOUBLE_COLOR_COLORS[number];
export interface DoubleColorInput { screenColor: DoubleColorColor; newAttempt: boolean }
export interface DoubleColorOutput { stage: number; digit: number; nextStage: number }

export const solveDoubleColor = (
  roundId: string, bombId: string, moduleId: string, input: DoubleColorInput,
): Promise<{ output: DoubleColorOutput; solved: boolean }> =>
  solveModule<DoubleColorInput, { output: DoubleColorOutput; solved: boolean }>(roundId, bombId, moduleId, input);
