import { solveModule } from "../lib/api";

export interface USAMazeOutput {
  route: string[];
  presses: string[];
}

export const solveUSAMaze = (
  roundId: string, bombId: string, moduleId: string,
  currentState: string, destinationState: string, dayOfWeek: string,
) => solveModule<
  { currentState: string; destinationState: string; dayOfWeek: string },
  { output: USAMazeOutput; solved: boolean }
>(roundId, bombId, moduleId, { currentState, destinationState, dayOfWeek });
