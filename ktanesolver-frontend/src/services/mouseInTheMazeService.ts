import { api, withErrorWrapping } from "../lib/api";

export type SphereColor = "GREEN" | "BLUE" | "WHITE" | "YELLOW";
export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
export type MouseMove = "FORWARD" | "BACKWARD" | "TURN_LEFT" | "TURN_RIGHT";

export interface Cell {
  row: number;
  col: number;
}

/** 10×10 maze: horizontalWalls[9][10], verticalWalls[10][9], sphere positions by color. */
export interface MouseInTheMazeMaze {
  horizontalWalls: boolean[][];
  verticalWalls: boolean[][];
  spherePositions: Record<SphereColor, Cell>;
}

export interface MouseInTheMazeSolveRequest {
  input: {
    /** Legacy: maze 1–6. Omit when using sphere identification. */
    mazeIndex?: number;
    torusColor: SphereColor;
    /** Legacy: start position. Omit when using sphere identification. */
    start?: Cell;
    startDirection?: Direction;
    /** Sphere colour at current position (go to nearest sphere first). */
    sphereColorAtPosition?: SphereColor;
    /** Four distances to nearest wall in any order (solver tries all 24 permutations). */
    stepsToWall?: [number, number, number, number];
  };
}

export interface MouseInTheMazeSolveResponse {
  output?: {
    targetSphereColor: SphereColor;
    targetCell: Cell;
    moves: MouseMove[];
    maze?: MouseInTheMazeMaze;
    /** Start cell used (included when maze was identified from sphere + distances). */
    startCell?: Cell;
  };
  solved?: boolean;
  reason?: string;
}

export const solveMouseInTheMaze = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  request: MouseInTheMazeSolveRequest
): Promise<MouseInTheMazeSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<MouseInTheMazeSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      request
    );
    return response.data;
  });
};
