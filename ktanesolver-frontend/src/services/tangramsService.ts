import { solveModule } from "../lib/api";

export type TangramsChipType = "TAN-S" | "TAN-D";

export interface TangramsInput {
  chipType: TangramsChipType;
  chipCode: string;
}

export interface TangramsConnection {
  positivePin: number;
  negativePin: number;
}

export interface TangramsOutput {
  connections: TangramsConnection[];
}

export const solveTangrams = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: TangramsInput,
) => solveModule<TangramsInput, { output: TangramsOutput; solved: boolean }>(
  roundId,
  bombId,
  moduleId,
  input,
);
