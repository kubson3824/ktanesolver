import { solveModule } from "../lib/api";

export interface SynchronizationInput { displayNumber: number; speeds: number[] }
export interface SynchronizationStep { firstPosition: number; firstState: string; secondPosition: number; secondState: string }
export interface SynchronizationOutput { method: string; steps: SynchronizationStep[]; timerDigit: number }
export const solveSynchronization = (
  roundId: string, bombId: string, moduleId: string, input: SynchronizationInput,
): Promise<{ output: SynchronizationOutput; solved: boolean }> =>
  solveModule<SynchronizationInput, { output: SynchronizationOutput; solved: boolean }>(roundId, bombId, moduleId, input);
