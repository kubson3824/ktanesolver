import { solveModule } from "../lib/api";

export interface ModulusManipulationInput { minutesRemaining: number }
export interface ModulusManipulationOutput { startingNumber: number; otherUnsolvedModules: number; answer: number; submission: string; minutesRemaining: number }
export const solveModulusManipulation = (roundId: string, bombId: string, moduleId: string, input: ModulusManipulationInput) =>
  solveModule<ModulusManipulationInput, { output: ModulusManipulationOutput; solved: boolean }>(roundId, bombId, moduleId, input);
