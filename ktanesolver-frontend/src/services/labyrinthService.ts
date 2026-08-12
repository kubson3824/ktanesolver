import { solveModule } from "../lib/api";

export interface LabyrinthStep {
  layer: number;
  phase: "ASCENT" | "DESCENT";
  start: string;
  destination: string;
  directions: Array<"UP" | "LEFT" | "RIGHT" | "DOWN">;
}

export interface LabyrinthOutput {
  nextLayer: number;
  steps: LabyrinthStep[];
  portals: string[][];
}

export const solveLabyrinth = (
  roundId: string, bombId: string, moduleId: string, layer: number, current: string, portal1: string, portal2: string,
): Promise<{ output: LabyrinthOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { layer, current, portal1, portal2 });
