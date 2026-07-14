import { solveModule } from "../lib/api";

export interface ColorMathInput {
  leftColors: string[];
  rightColors: string[];
  displayColor: string;
  operation: string;
}

export interface ColorMathOutput {
  baseNumber: number;
  operand: number;
  answer: number;
  colors: string[];
}

export const solveColorMath = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: ColorMathInput,
): Promise<{ output: ColorMathOutput }> =>
  solveModule<ColorMathInput, { output: ColorMathOutput }>(roundId, bombId, moduleId, input);
