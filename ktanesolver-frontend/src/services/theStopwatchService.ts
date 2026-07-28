import { solveModule } from "../lib/api";

export interface TheStopwatchInput {
  bombStartTimeSeconds: number;
}

export interface TheStopwatchOutput {
  baseRuntimeSeconds: number;
  runtimeSeconds: number;
  formattedRuntime: string;
}

export const solveTheStopwatch = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: TheStopwatchInput,
) => solveModule<TheStopwatchInput, { output: TheStopwatchOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
