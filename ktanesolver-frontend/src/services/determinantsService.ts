import { solveModule } from "../lib/api";

export interface DeterminantsInput { a: number; b: number; c: number; d: number }
export interface DeterminantsOutput { determinant: number }

export const solveDeterminants = (
  roundId: string, bombId: string, moduleId: string, input: DeterminantsInput,
): Promise<{ output: DeterminantsOutput; solved: boolean }> =>
  solveModule<DeterminantsInput, { output: DeterminantsOutput; solved: boolean }>(roundId, bombId, moduleId, input);
