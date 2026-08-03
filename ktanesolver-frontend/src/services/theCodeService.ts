import { solveModule } from "../lib/api";

export interface TheCodeInput {
  displayedNumber: number;
}

export interface TheCodeOutput {
  code: number;
}

export const solveTheCode = (roundId: string, bombId: string, moduleId: string, input: TheCodeInput) =>
  solveModule<TheCodeInput, { output: TheCodeOutput; solved: boolean }>(roundId, bombId, moduleId, input);
