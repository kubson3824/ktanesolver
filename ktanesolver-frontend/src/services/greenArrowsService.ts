import { solveModule } from "../lib/api";

export interface GreenArrowsOutput { direction: string; streakAfterPress: number; finalPress: boolean }
export const solveGreenArrows = (roundId: string, bombId: string, moduleId: string, displayedNumber: number, resetStreak: boolean): Promise<{ output: GreenArrowsOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { displayedNumber, resetStreak });
