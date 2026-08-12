import { solveModule } from "../lib/api";

export interface AlgebraInput {
  equation: string;
}

export interface AlgebraOutput {
  stage: number;
  equation: string;
  answer: string;
}

export const solveAlgebra = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: AlgebraInput,
) => solveModule<AlgebraInput, { output: AlgebraOutput; solved: boolean }>(
  roundId,
  bombId,
  moduleId,
  input,
);
