import { solveModule } from "../lib/api";

export interface SimonSamplesInput { stage: number; call: string; padSounds: string[] }
export interface SimonSamplesOutput { stage: number; response: string[]; presses: number[] }
export const solveSimonSamples = (
  roundId: string, bombId: string, moduleId: string, input: SimonSamplesInput,
): Promise<{ output: SimonSamplesOutput; solved: boolean }> =>
  solveModule<SimonSamplesInput, { output: SimonSamplesOutput; solved: boolean }>(roundId, bombId, moduleId, input);
