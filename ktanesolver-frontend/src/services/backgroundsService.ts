import { solveModule } from "../lib/api";

export interface BackgroundsInput {
  backingColor: "RED" | "ORANGE" | "YELLOW" | "GREEN" | "BLUE" | "PURPLE" | "WHITE" | "GRAY" | "BLACK";
  buttonColor: BackgroundsInput["backingColor"];
}

export interface BackgroundsOutput {
  targetCount: number;
  letterPair: string;
  firstRule: number;
  secondRule: number;
}

export const solveBackgrounds = (roundId: string, bombId: string, moduleId: string, input: BackgroundsInput) =>
  solveModule<BackgroundsInput, { output: BackgroundsOutput; solved: boolean }>(roundId, bombId, moduleId, input);
