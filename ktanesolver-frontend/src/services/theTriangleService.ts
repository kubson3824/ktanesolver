import { solveModule } from "../lib/api";

export interface TheTriangleOutput { color: string; position: string; completedPositions: string[] }
export const solveTheTriangle = (
  roundId: string, bombId: string, moduleId: string, rotation: string, artwork: string, letter: string, colors: string[],
): Promise<{ output: TheTriangleOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { rotation, artwork, letter, colors });
