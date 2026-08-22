import { solveModule } from "../lib/api";

export interface BlueArrowsOutput { directions: string[]; command: string }

export const solveBlueArrows = (
  roundId: string, bombId: string, moduleId: string, coordinate: string,
): Promise<{ output: BlueArrowsOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { coordinate });
