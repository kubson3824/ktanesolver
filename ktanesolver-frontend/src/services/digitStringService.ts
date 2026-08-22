import { solveModule } from "../lib/api";

export interface DigitStringOutput { answer: number; expression: string; serialPosition: number; rule: string }
export const solveDigitString = (roundId: string, bombId: string, moduleId: string, displayedNumber: string): Promise<{ output: DigitStringOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { displayedNumber });
