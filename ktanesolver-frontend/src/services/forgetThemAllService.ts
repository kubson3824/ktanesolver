import { solveModule } from "../lib/api";

export interface ForgetThemAllStage { moduleName: string; litLeds: string[] }
export interface ForgetThemAllOutput { finalValue: number; keyStage: number; keyModule: string; cutColors: string[]; command: string }

export const solveForgetThemAll = (
  roundId: string, bombId: string, moduleId: string, startingBombMinutes: number, stages: ForgetThemAllStage[], alreadyCutColors: string[],
): Promise<{ output: ForgetThemAllOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { startingBombMinutes, stages, alreadyCutColors });
