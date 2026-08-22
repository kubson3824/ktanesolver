import { solveModule } from "../lib/api";

export interface StackemOutput { cubeValues: Record<string, number>; stacks: string[][] }
export const solveStackem = (roundId: string, bombId: string, moduleId: string, targetSums: number[]): Promise<{ output: StackemOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { targetSums });
