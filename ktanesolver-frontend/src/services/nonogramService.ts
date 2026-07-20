import { solveModule } from "../lib/api";

export interface NonogramInput {
  colorPairs: string[][];
}

export interface NonogramOutput {
  columnClues: number[][];
  rowClues: number[][];
  filledCells: string[];
}

export const solveNonogram = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: NonogramInput,
) => solveModule<NonogramInput, { output: NonogramOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
