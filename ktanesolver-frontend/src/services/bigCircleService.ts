import { solveModule } from "../lib/api";

export interface BigCircleInput {
  spinDirection: string;
  twoFactorCodes: number[];
  specialPortCount: number;
}

export interface BigCircleOutput {
  score: number | null;
  serialIndex: number | null;
  serialCharacter: string;
  pressSequence: string[];
  bobException: boolean;
  spinDirection: string;
}

export const solveBigCircle = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: BigCircleInput,
) => solveModule<BigCircleInput, { output: BigCircleOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
