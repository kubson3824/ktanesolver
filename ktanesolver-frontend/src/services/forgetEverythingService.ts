import { solveModule } from "../lib/api";

export type ForgetEverythingColor = "RED" | "YELLOW" | "GREEN" | "BLUE";

export interface ForgetEverythingInput {
  action: "RECORD_STAGE" | "FINISH" | "RESET";
  stage?: number;
  dials?: string;
  nixies?: string;
  colors?: ForgetEverythingColor[];
}

export interface ForgetEverythingOutput {
  solution: string | null;
  recordedStages: number;
}

export const solveForgetEverything = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: ForgetEverythingInput,
) => solveModule<ForgetEverythingInput, { output: ForgetEverythingOutput }>(roundId, bombId, moduleId, input);
