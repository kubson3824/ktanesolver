import { solveModule } from "../lib/api";

export interface FunctionsObservation {
  a: number;
  b: number;
  result: number;
}

export interface FunctionsOutput {
  queryFunctionNumber: number | null;
  queryFunction: string | null;
  finalFunctionNumber: number | null;
  finalFunction: string | null;
  answer: number | null;
  candidateFunctionNumbers: number[];
  suggestedQuery: number[] | null;
}

export const solveFunctions = (
  roundId: string,
  bombId: string,
  moduleId: string,
  leftNumber: number,
  letter: string,
  rightNumber: number,
  observations: FunctionsObservation[],
): Promise<{ output: FunctionsOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { leftNumber, letter, rightNumber, observations });
