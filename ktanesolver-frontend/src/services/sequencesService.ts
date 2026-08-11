import { solveModule } from "../lib/api";

export interface SequencesOutput {
  coefficient: number;
  constant: number;
  formula: string;
}

export const solveSequences = (
  roundId: string, bombId: string, moduleId: string, first: number, second: number, third: number,
): Promise<{ output: SequencesOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { first, second, third });
