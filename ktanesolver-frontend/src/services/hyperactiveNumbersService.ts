import { solveModule } from "../lib/api";

export interface HyperactiveNumbersOutput { color: string; parity: string; command: string }

export const solveHyperactiveNumbers = (
  roundId: string, bombId: string, moduleId: string, leftNumber: number, rightNumber: number,
): Promise<{ output: HyperactiveNumbersOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { leftNumber, rightNumber });
