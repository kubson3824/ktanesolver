import { solveModule } from "../lib/api";

export interface HarmonySequenceOutput { stage: number; pressPositions: number[] }
export const solveHarmonySequence = (
  roundId: string, bombId: string, moduleId: string, stage: number, pitchRanks: number[],
): Promise<{ output: HarmonySequenceOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { stage, pitchRanks });
