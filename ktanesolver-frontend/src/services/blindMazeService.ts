import { solveModule } from "../lib/api";

export type BlindMazeColor = "RED" | "GREEN" | "BLUE" | "GRAY" | "YELLOW";
export type BlindMazeDirection = "NORTH" | "EAST" | "SOUTH" | "WEST";

export interface BlindMazeInput {
  north: BlindMazeColor;
  east: BlindMazeColor;
  south: BlindMazeColor;
  west: BlindMazeColor;
}

export interface BlindMazeOutput {
  mazeNumber: number;
  rotationRule: number;
  rotation: string;
  startRow: number;
  startColumn: number;
  moves: BlindMazeDirection[];
}

export const solveBlindMaze = (roundId: string, bombId: string, moduleId: string, input: BlindMazeInput) =>
  solveModule<BlindMazeInput, { output: BlindMazeOutput; solved: boolean }>(roundId, bombId, moduleId, input);
