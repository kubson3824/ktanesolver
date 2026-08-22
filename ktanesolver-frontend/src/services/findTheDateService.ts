import { solveModule } from "../lib/api";
export interface FindTheDateInput { day: number; month: string; year: number }
export interface FindTheDateOutput { stage: number; weekday: string; nextStage: number }
export const solveFindTheDate = (roundId: string, bombId: string, moduleId: string, input: FindTheDateInput) => solveModule<FindTheDateInput, { output: FindTheDateOutput; solved: boolean }>(roundId, bombId, moduleId, input);
