import { solveModule } from "../lib/api";
export interface TheBlockInput { sideColors: string[] }
export interface TheBlockOutput { rule: number; presses: string[] }
export const solveTheBlock = (roundId: string, bombId: string, moduleId: string, input: TheBlockInput) => solveModule<TheBlockInput, { output: TheBlockOutput; solved: boolean }>(roundId, bombId, moduleId, input);
