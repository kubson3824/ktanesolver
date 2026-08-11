import { solveModule } from "../lib/api";

export interface ThreeDTunnelsInput {
  currentSymbol: string;
  targetSymbol: string;
  frontWall: boolean;
  leftWall: boolean;
  rightWall: boolean;
  upWall: boolean;
  downWall: boolean;
  restartTracking: boolean;
}
export interface ThreeDTunnelsOutput { stage: number; targetSymbol: string; actions: string[]; localizationStep: boolean; candidateCount: number }
export const solveThreeDTunnels = (
  roundId: string, bombId: string, moduleId: string, input: ThreeDTunnelsInput,
): Promise<{ output: ThreeDTunnelsOutput; solved: boolean }> =>
  solveModule<ThreeDTunnelsInput, { output: ThreeDTunnelsOutput; solved: boolean }>(roundId, bombId, moduleId, input);
