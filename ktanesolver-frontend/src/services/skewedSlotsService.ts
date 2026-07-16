import { solveModule } from "../lib/api";

export interface SkewedSlotsInput {
  digits: number[];
}

export interface SkewedSlotsOutput {
  digits: number[];
  code: string;
}

export const solveSkewedSlots = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: SkewedSlotsInput,
) => solveModule<SkewedSlotsInput, { output: SkewedSlotsOutput }>(roundId, bombId, moduleId, input);
