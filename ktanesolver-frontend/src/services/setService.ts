import { solveModule } from "../lib/api";

export interface SetCardInput {
  symbol: string;
  dots: number;
  shading: string;
}

export interface SetInput {
  cards: SetCardInput[];
}

export interface SetOutput {
  positions: string[];
}

export const solveSet = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: SetInput,
) => solveModule<SetInput, { output: SetOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
