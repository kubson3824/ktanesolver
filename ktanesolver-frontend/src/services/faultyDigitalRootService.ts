import { solveModule } from "../lib/api";

export interface FaultyDigitalRootOutput {
  root: number;
  binary: string;
  presses: string[];
}

export const solveFaultyDigitalRoot = (
  roundId: string, bombId: string, moduleId: string,
  first: number, second: number, third: number, faulty: number,
): Promise<{ output: FaultyDigitalRootOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { first, second, third, faulty });
