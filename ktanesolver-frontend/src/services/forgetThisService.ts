import { solveModule } from "../lib/api";

export const FORGET_THIS_COLORS = ["CYAN", "MAGENTA", "YELLOW", "BLACK", "WHITE"] as const;
export type ForgetThisColor = typeof FORGET_THIS_COLORS[number];
export interface ForgetThisStage { digit: string; color: ForgetThisColor }
export interface ForgetThisStep { stage: number; before: number; operation: string; after: number }
export interface ForgetThisOutput { answer: string; decimalAnswer: number; steps: ForgetThisStep[] }

export const solveForgetThis = (
  roundId: string, bombId: string, moduleId: string, stages: ForgetThisStage[], implementationStages: number[],
): Promise<{ output: ForgetThisOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { stages, implementationStages });
