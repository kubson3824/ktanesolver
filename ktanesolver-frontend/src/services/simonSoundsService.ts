import { solveModule } from "../lib/api";

export interface SimonSoundsOutput { stage: number; presses: string[]; sampleCondition: string; inputCondition: string }
export const solveSimonSounds = (
  roundId: string, bombId: string, moduleId: string, stage: number, sampleSequence: string[], finalStage: boolean,
): Promise<{ output: SimonSoundsOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { stage, sampleSequence, finalStage });
