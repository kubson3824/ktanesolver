import { solveModule } from "../lib/api";

export interface PigpenRotationsOutput { answer: string; shift: number }
export const solvePigpenRotations = (
  roundId: string, bombId: string, moduleId: string, displayed: string,
): Promise<{ output: PigpenRotationsOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { displayed });
