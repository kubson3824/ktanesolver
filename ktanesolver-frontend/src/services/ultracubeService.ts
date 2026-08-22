import { solveModule } from "../lib/api";

export interface UltracubeOutput {
  stage: number;
  face: string;
  targetColor: string;
  vertex: string;
}

export const solveUltracube = (
  roundId: string,
  bombId: string,
  moduleId: string,
  rotations: string[],
  stage: number,
  vertexColors: string[],
): Promise<{ output: UltracubeOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { rotations, stage, vertexColors });
