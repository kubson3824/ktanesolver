import { solveModule } from "../lib/api";

export interface RhythmsInput {
  rhythm: number;
  color: string;
}

export interface RhythmAction {
  button: string;
  beeps: number;
}

export interface RhythmsOutput {
  mash: boolean;
  actions: RhythmAction[];
}

export const solveRhythms = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: RhythmsInput,
): Promise<{ output: RhythmsOutput }> =>
  solveModule<RhythmsInput, { output: RhythmsOutput }>(roundId, bombId, moduleId, input);
