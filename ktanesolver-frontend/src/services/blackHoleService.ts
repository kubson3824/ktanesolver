import { solveModule } from "../lib/api";

export interface BlackHoleOutput {
  digit: number;
  enteredGlobally: number;
  expectedGlobally: number;
  enteredHere: number;
  expectedHere: number;
  shortened: boolean;
}

export const solveBlackHole = (
  roundId: string,
  bombId: string,
  moduleId: string,
): Promise<{ output: BlackHoleOutput; solved: boolean }> =>
  solveModule<Record<string, never>, { output: BlackHoleOutput; solved: boolean }>(roundId, bombId, moduleId, {});
