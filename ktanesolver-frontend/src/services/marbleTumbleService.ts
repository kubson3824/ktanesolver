import { solveModule } from "../lib/api";

export type MarbleColor = "RED" | "YELLOW" | "GREEN" | "BLUE" | "SILVER";

export interface MarbleTumbleInput {
  colors: MarbleColor[];
  safeGaps: number[];
  trapPositions: number[];
}

export interface MarbleTumbleOutput {
  timerDigits: number[];
  instruction: string;
}

export const solveMarbleTumble = (roundId: string, bombId: string, moduleId: string, input: MarbleTumbleInput) =>
  solveModule<MarbleTumbleInput, { output: MarbleTumbleOutput; solved: boolean }>(roundId, bombId, moduleId, input);
