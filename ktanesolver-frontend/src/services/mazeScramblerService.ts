import { solveModule } from "../lib/api";

export const MAZE_SCRAMBLER_POSITIONS = [
  "Top-left", "Top-middle", "Top-right",
  "Middle-left", "Center", "Middle-right",
  "Bottom-left", "Bottom-middle", "Bottom-right",
] as const;

export interface MazeScramblerInput {
  startPosition: number;
  goalPosition: number;
  mazeMarkings: number[];
}

export interface MazeScramblerOutput {
  maze: number;
  presses: string[];
  moves: string[];
}

export const solveMazeScrambler = (
  roundId: string, bombId: string, moduleId: string, input: MazeScramblerInput,
): Promise<{ output: MazeScramblerOutput; solved: boolean }> =>
  solveModule<MazeScramblerInput, { output: MazeScramblerOutput; solved: boolean }>(roundId, bombId, moduleId, input);
