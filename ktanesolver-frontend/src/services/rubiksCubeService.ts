import { solveModule } from "../lib/api";

export interface RubiksCubeInput {
  faceColors: string[];
}

export interface RubiksCubeOutput {
  moves: string[];
}

export function getRubiksCubeMoveDisplay(move: string) {
  const counterClockwise = move.endsWith("'");
  return {
    face: move.charAt(0),
    direction: counterClockwise ? "counter-clockwise" : "clockwise",
    arrow: counterClockwise ? "↺" : "↻",
  };
}

export const solveRubiksCube = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: RubiksCubeInput,
): Promise<{ output: RubiksCubeOutput }> =>
  solveModule<RubiksCubeInput, { output: RubiksCubeOutput }>(roundId, bombId, moduleId, input);
