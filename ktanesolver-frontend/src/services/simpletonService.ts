import { solveModule } from "../lib/api";

export interface SimpletonOutput { action: "PUSH"; }

export const solveSimpleton = (
  roundId: string, bombId: string, moduleId: string,
): Promise<{ output: SimpletonOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, {});
