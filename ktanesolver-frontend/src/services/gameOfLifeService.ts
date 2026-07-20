import { solveModule } from "../lib/api";

export type GameOfLifeColor = "BLACK" | "WHITE" | "RED" | "ORANGE" | "YELLOW" | "GREEN" | "BLUE" | "PURPLE" | "BROWN";
export type GameOfLifeCell = { first: GameOfLifeColor; second: GameOfLifeColor };

export interface GameOfLifeInput {
  cells: GameOfLifeCell[];
  timerBelowHalf: boolean;
}

export interface GameOfLifeOutput {
  whiteCells: boolean[];
  submitInitial: boolean;
}

export const solveGameOfLife = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: GameOfLifeInput,
) => solveModule<GameOfLifeInput, { output: GameOfLifeOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
