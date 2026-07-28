import { api, withErrorWrapping } from "../lib/api";

export type LondonUndergroundAction = "SOLVE_STAGE" | "RESET";
export interface LondonUndergroundInput { action: LondonUndergroundAction; departure?: string; destination?: string }
export interface LondonUndergroundLeg { line: string; station: string }
export interface LondonUndergroundOutput { journey: LondonUndergroundLeg[]; stage: number }

export const solveLondonUnderground = async (
  roundId: string, bombId: string, moduleId: string, input: LondonUndergroundInput,
) => withErrorWrapping(async () => (await api.post<{ output: LondonUndergroundOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
)).data);
