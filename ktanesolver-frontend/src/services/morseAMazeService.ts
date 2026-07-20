import { api, withErrorWrapping } from "../lib/api";

export type MorseAMazeMove = "UP" | "DOWN" | "LEFT" | "RIGHT";
export type MorseAMazeCell = { row: number; col: number };

export interface MorseAMazeInput {
  word: string;
  start: MorseAMazeCell;
  target: MorseAMazeCell;
  mazeValueOverride?: number;
}

export interface MorseAMazeOutput {
  mazeIndex: number;
  mazeWord: string;
  moves: MorseAMazeMove[];
}

export interface MorseAMazeSolveResponse {
  output: MorseAMazeOutput;
  solved: boolean;
  reason?: string;
}

export const solveMorseAMaze = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: MorseAMazeInput,
): Promise<MorseAMazeSolveResponse> => withErrorWrapping(async () => {
  const response = await api.post<MorseAMazeSolveResponse>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
    { input },
  );
  return response.data;
});
