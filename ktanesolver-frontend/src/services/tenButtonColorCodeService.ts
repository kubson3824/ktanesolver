import { solveModule } from "../lib/api";

export interface TenButtonColorCodeOutput {
  stage: number;
  targetColors: string[];
  presses: number[];
}

export const solveTenButtonColorCode = (
  roundId: string, bombId: string, moduleId: string, stage: number, colors: string[],
): Promise<{ output: TenButtonColorCodeOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { stage, colors });
