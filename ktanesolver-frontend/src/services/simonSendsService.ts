import { solveModule } from "../lib/api";

export interface SimonSendsInput {
  redLetter: string;
  greenLetter: string;
  blueLetter: string;
}

export interface SimonSendsOutput {
  solutionLetters: string;
  transmission: string;
}

export const solveSimonSends = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: SimonSendsInput,
): Promise<{ output: SimonSendsOutput }> =>
  solveModule<SimonSendsInput, { output: SimonSendsOutput }>(roundId, bombId, moduleId, input);
