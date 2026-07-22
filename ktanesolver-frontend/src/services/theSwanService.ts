import { solveModule } from "../lib/api";

export interface TheSwanInput { resetCount: number }
export interface TheSwanOutput { code: string; resetCount: number }

export const solveTheSwan = (roundId: string, bombId: string, moduleId: string, input: TheSwanInput) =>
  solveModule<TheSwanInput, { output: TheSwanOutput; solved: boolean }>(roundId, bombId, moduleId, input);
