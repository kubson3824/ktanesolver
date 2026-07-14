import { solveModule } from "../lib/api";

export type BitwiseOperator = "AND" | "OR" | "XOR" | "NOT";

export interface BitwiseOperationsOutput {
  byte1: string;
  byte2: string;
  answer: string;
}

export const solveBitwiseOperations = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: { operator: BitwiseOperator; startingTimeMinutes: number },
) => solveModule<typeof input, { output: BitwiseOperationsOutput; solved: boolean }>(roundId, bombId, moduleId, input);
