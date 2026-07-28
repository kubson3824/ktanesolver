import { solveModule } from "../lib/api";

export interface PieOutput {
  position: number;
  x: number;
  y: number;
  pressOrder: number[];
}

export const solvePie = (
  roundId: string,
  bombId: string,
  moduleId: string,
  digits: string,
) => solveModule<{ digits: string }, { output: PieOutput; solved: boolean }>(
  roundId,
  bombId,
  moduleId,
  { digits },
);
