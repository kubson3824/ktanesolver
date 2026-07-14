import { api, withErrorWrapping } from "../lib/api";

export type FastMathAction = "SOLVE_STAGE" | "RESET" | "COMPLETE";
export interface FastMathInput { action: FastMathAction; leftLetter?: string; rightLetter?: string }
export interface FastMathOutput { answer: string; stage: number }

export const solveFastMath = async (roundId: string, bombId: string, moduleId: string, input: FastMathInput) =>
  withErrorWrapping(async () => (await api.post<{ output: FastMathOutput; solved: boolean }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
  )).data);
