import { solveModule } from "../lib/api";

export interface LedMathOutput { valueA: number; valueB: number; operator: string; answer: number }
export const solveLedMath = (
  roundId: string, bombId: string, moduleId: string, ledA: string, ledB: string, operator: string,
): Promise<{ output: LedMathOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { ledA, ledB, operator });
