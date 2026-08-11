import { solveModule } from "../lib/api";

export interface PayRespectsOutput { action: string }

export const solvePayRespects = (
  roundId: string, bombId: string, moduleId: string, active: boolean,
): Promise<{ output: PayRespectsOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { active });
