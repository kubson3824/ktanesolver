import { solveModule } from "../lib/api";

export interface DigitalRootInput {
  first: number;
  second: number;
  third: number;
  displayedRoot: number;
}

export interface DigitalRootOutput {
  button: "YES" | "NO";
  digitalRoot: number;
}

export const solveDigitalRoot = (roundId: string, bombId: string, moduleId: string, input: DigitalRootInput) =>
  solveModule<DigitalRootInput, { output: DigitalRootOutput; solved: boolean }>(roundId, bombId, moduleId, input);
