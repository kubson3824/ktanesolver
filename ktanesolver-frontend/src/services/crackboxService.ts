import { solveModule } from "../lib/api";

export interface CrackboxOutput { solution: string[]; twitchTokens: string[]; }

export const solveCrackbox = (
  roundId: string, bombId: string, moduleId: string, cells: string[], selectedCell: number,
): Promise<{ output: CrackboxOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { cells, selectedCell });
