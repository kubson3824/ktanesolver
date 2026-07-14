import { solveModule } from "../lib/api";

export interface CoordinatesOutput {
  width: number;
  height: number;
  matchingClues: string[];
}

export const solveCoordinates = (
  roundId: string,
  bombId: string,
  moduleId: string,
  clues: string[],
): Promise<{ output: CoordinatesOutput }> =>
  solveModule<{ clues: string[] }, { output: CoordinatesOutput }>(roundId, bombId, moduleId, { clues });
