import { solveModule } from "../lib/api";

export interface ErrorCodesInput {
  errorCodes: string[];
}

export interface ErrorCodesOutput {
  activeErrorCode: string;
  decimalFixCode: number;
  format: string;
  fixCode: string;
}

export const solveErrorCodes = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: ErrorCodesInput,
) => solveModule<ErrorCodesInput, { output: ErrorCodesOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
