import { api, withErrorWrapping } from "../lib/api";

export type MarkerLetter = "A" | "B" | "C" | "D" | "H";
export type GoalDirection = "N" | "S" | "E" | "W";

export type ThreeDMazeMove = "FORWARD" | "TURN_LEFT" | "TURN_RIGHT";

/** 8×8 maze: walls, star positions [row,col] 0-based, optional letter per cell. Used for finished maze display. */
export interface ThreeDMazeMaze {
  horizontalWalls: boolean[][];
  verticalWalls: boolean[][];
  starPositions: number[][];
  letterGrid: (string | null)[][] | null;
}

export interface ThreeDMazeInput {
  /** Three distinct maze-identifying letters (A/B/C/D/H) observed on the floor; order does not matter. */
  starLetters: [string, string, string];
  /** Goal direction (N/S/E/W) — omit when first guiding to a direction marker (star). */
  goalDirection?: GoalDirection;
  /** Exact tracked state used after the first phase. */
  currentRow?: number;
  currentCol?: number;
  currentFacing?: GoalDirection;
  /** Optional: letter on the floor at current cell (for position identification). */
  letterAtPosition?: string;
  /** Distances to wall [front, right, behind, left]; backend infers both position and facing. */
  stepsToWall?: [number, number, number, number];
}

export interface ThreeDMazeOutput {
  goalRow: number;
  goalCol: number;
  goalDirection: string | null;
  moves?: ThreeDMazeMove[];
  startRow?: number;
  startCol?: number;
  startFacing?: string;
  /** "go_to_star" = path to nearest direction marker; "go_to_goal" = path to goal wall. */
  phase?: string;
  message?: string;
  /** Maze layout when a path was returned; for UI grid display. */
  maze?: ThreeDMazeMaze;
}

export interface ThreeDMazeSolveRequest {
  input: ThreeDMazeInput;
}

export interface ThreeDMazeSolveResponse {
  output?: ThreeDMazeOutput;
  solved?: boolean;
  reason?: string;
}

export const solveThreeDMaze = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  request: ThreeDMazeSolveRequest
): Promise<ThreeDMazeSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<ThreeDMazeSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      request
    );
    return response.data;
  });
};
