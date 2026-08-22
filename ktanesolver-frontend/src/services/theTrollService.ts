import { solveModule } from "../lib/api";

export interface TheTrollOutput { prepPresses: number; additionalSolvesToActivate: number; timerDigit: number; prepCommand: string; activationCommand: string }
export const solveTheTroll = (roundId: string, bombId: string, moduleId: string): Promise<{ output: TheTrollOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, {});
