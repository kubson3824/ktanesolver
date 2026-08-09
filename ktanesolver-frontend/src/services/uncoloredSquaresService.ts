import { solveModule } from "../lib/api";

export type UncoloredSquaresColor = "RED" | "GREEN" | "BLUE" | "YELLOW" | "MAGENTA" | "BLACK";
export interface UncoloredSquaresInput { grid: UncoloredSquaresColor[] }
export interface UncoloredSquaresOutput {
  firstColor: UncoloredSquaresColor;
  otherColor: UncoloredSquaresColor;
  pattern: string[];
  placements: string[][];
  willSolve: boolean;
}

export const solveUncoloredSquares = (
  roundId: string, bombId: string, moduleId: string, input: UncoloredSquaresInput,
): Promise<{ output: UncoloredSquaresOutput; solved: boolean }> =>
  solveModule<UncoloredSquaresInput, { output: UncoloredSquaresOutput; solved: boolean }>(roundId, bombId, moduleId, input);
