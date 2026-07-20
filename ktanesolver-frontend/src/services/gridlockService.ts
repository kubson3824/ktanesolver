import { solveModule } from "../lib/api";

export interface GridlockInput {
  pages: string[][];
}

export interface GridlockOutput {
  coordinate: string;
  path: string[];
}

export const solveGridlock = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: GridlockInput,
) => solveModule<GridlockInput, { output: GridlockOutput; solved: boolean }>(roundId, bombId, moduleId, input);
