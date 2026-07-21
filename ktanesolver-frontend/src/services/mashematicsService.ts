import { solveModule } from "../lib/api";

export type MashematicsOperator = "ADD" | "SUBTRACT" | "MULTIPLY";

export interface MashematicsInput {
  first: number;
  firstOperator: MashematicsOperator;
  second: number;
  secondOperator: MashematicsOperator;
  third: number;
}

export interface MashematicsOutput {
  rawAnswer: number;
  pressCount: number;
}

export const solveMashematics = (roundId: string, bombId: string, moduleId: string, input: MashematicsInput) =>
  solveModule<MashematicsInput, { output: MashematicsOutput; solved: boolean }>(roundId, bombId, moduleId, input);
