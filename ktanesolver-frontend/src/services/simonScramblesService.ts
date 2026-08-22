import { solveModule } from "../lib/api";

export interface SimonScramblesOutput { presses: string[] }
export const solveSimonScrambles = (
  roundId: string, bombId: string, moduleId: string, flashes: string[],
): Promise<{ output: SimonScramblesOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { flashes });
