import { solveModule } from "../lib/api";
export interface InsaneTalkInput { phrase: string; buttonLabels: number[] }
export interface InsaneTalkOutput { pressLabels: number[]; phraseCode: string; quoted: boolean }
export const solveInsaneTalk = (roundId: string, bombId: string, moduleId: string, input: InsaneTalkInput) => solveModule<InsaneTalkInput, { output: InsaneTalkOutput; solved: boolean }>(roundId, bombId, moduleId, input);
