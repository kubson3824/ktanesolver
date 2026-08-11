import { solveModule } from "../lib/api";

export interface OneHundredAndOneDalmatiansOutput { name: string; patternNumber: number }

export const solveOneHundredAndOneDalmatians = (
  roundId: string, bombId: string, moduleId: string, patternNumber: number,
): Promise<{ output: OneHundredAndOneDalmatiansOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { patternNumber });
