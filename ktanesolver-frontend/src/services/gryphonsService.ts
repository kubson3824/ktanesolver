import { solveModule } from "../lib/api";

export interface GryphonsInput { name: string; age: number }
export interface GryphonsOutput { birdType: string; catType: string; accessory: string }

export const solveGryphons = (roundId: string, bombId: string, moduleId: string, input: GryphonsInput) =>
  solveModule<GryphonsInput, { output: GryphonsOutput; solved: boolean }>(roundId, bombId, moduleId, input);
