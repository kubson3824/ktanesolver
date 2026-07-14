import { solveModule } from "../lib/api";

export interface RubiksCubeInput {
  faceColors: string[];
}

export interface RubiksCubeOutput {
  moves: string[];
}

export const solveRubiksCube = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: RubiksCubeInput,
): Promise<{ output: RubiksCubeOutput }> =>
  solveModule<RubiksCubeInput, { output: RubiksCubeOutput }>(roundId, bombId, moduleId, input);
