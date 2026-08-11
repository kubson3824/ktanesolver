import { solveModule } from "../lib/api";

export interface ThreeLedsOutput {
  targetStates: boolean[];
  togglePositions: number[];
}

export const solveThreeLeds = (
  roundId: string, bombId: string, moduleId: string, colors: string[], initialStates: boolean[],
): Promise<{ output: ThreeLedsOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { colors, initialStates });
