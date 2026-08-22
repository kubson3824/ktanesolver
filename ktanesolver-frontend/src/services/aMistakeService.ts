import { solveModule } from "../lib/api";
export interface AMistakeOutput { stage: number; timing: string; twitchCommand: string; nextStage: number }
export const solveAMistake = (roundId: string, bombId: string, moduleId: string) => solveModule<Record<string, never>, { output: AMistakeOutput; solved: boolean }>(roundId, bombId, moduleId, {});
