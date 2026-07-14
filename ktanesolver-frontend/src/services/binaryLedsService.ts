import { solveModule } from "../lib/api";

export interface BinaryLedsInput {
  observations: number[];
}

export interface BinaryLedsOutput {
  sequenceNumber: number;
  red: number;
  green: number;
  blue: number;
  recommendedColor: string;
  recommendedValue: number;
}

export const solveBinaryLeds = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: BinaryLedsInput,
): Promise<{ output: BinaryLedsOutput }> =>
  solveModule<BinaryLedsInput, { output: BinaryLedsOutput }>(roundId, bombId, moduleId, input);
