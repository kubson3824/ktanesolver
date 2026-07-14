import { solveModule } from "../lib/api";

export interface LightCycleInput {
  initialColors: string[];
}

export interface LightCycleOutput {
  sequence: string[];
}

export const solveLightCycle = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: LightCycleInput,
): Promise<{ output: LightCycleOutput }> =>
  solveModule<LightCycleInput, { output: LightCycleOutput }>(roundId, bombId, moduleId, input);
