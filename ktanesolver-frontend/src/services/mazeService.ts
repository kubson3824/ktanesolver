import { api, withErrorWrapping } from "../lib/api";

export type Move = "UP" | "DOWN" | "LEFT" | "RIGHT";

export interface Cell {
  row: number;
  col: number;
}

export interface MazeSolveRequest {
  input: {
    marker1: Cell;
    marker2: Cell;
    start: Cell;
    target: Cell;
  };
}

export interface MazeSolveResponse {
  output: {
    moves: Move[];
  };
}

export const solveMaze = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: MazeSolveRequest
): Promise<MazeSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<MazeSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
