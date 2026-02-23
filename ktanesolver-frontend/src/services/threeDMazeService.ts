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
  /** Three marker letters (A/B/C/D/H) the defuser sees at the three star positions; order does not matter. */
  starLetters: [string, string, string];
  /** Goal direction (N/S/E/W) — omit when first guiding to a direction marker (star). */
  goalDirection?: GoalDirection;
  /** Facing direction (N/S/E/W). Optional; when omitted with stepsToWall, the backend infers facing from the four distances. */
  currentFacing?: GoalDirection;
  /** Optional: letter on the floor at current cell (for position identification). */
  letterAtPosition?: string;
  /** Optional: distances to wall [front, left, right, behind] relative to the defuser. When currentFacing is omitted, backend infers both position and facing from these. */
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
