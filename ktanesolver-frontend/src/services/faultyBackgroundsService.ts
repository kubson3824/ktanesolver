import { solveModule } from "../lib/api";

export type FaultyBackgroundsColor = "RED" | "ORANGE" | "YELLOW" | "GREEN" | "BLUE" | "PURPLE" | "WHITE" | "GRAY" | "BLACK";
export type FaultyBackgroundsLabel = "PUSH_ME" | "BUSH_ME" | "PUSH_NE" | "PUSH_HE" | "PUSH_SHE";
export type FaultyBackgroundsCounterBehavior = "ALL_VISIBLE" | "LEFT_NO_CHANGE" | "RIGHT_NO_CHANGE" | "EVENS_HIDDEN" | "ODDS_HIDDEN" | "FIVE_HIDDEN";

export interface FaultyBackgroundsInput {
  backingColor: FaultyBackgroundsColor;
  leftButtonColor: FaultyBackgroundsColor;
  rightButtonColor: FaultyBackgroundsColor;
  leftButtonLabel: FaultyBackgroundsLabel;
  rightButtonLabel: FaultyBackgroundsLabel;
  counterBehavior: FaultyBackgroundsCounterBehavior;
}

export interface FaultyBackgroundsOutput {
  correctButton: "LEFT" | "RIGHT";
  targetCount: number;
  faultyRule: number;
  letterPair: string;
  firstBackgroundsRule: number;
  secondBackgroundsRule: number;
}

export const solveFaultyBackgrounds = (roundId: string, bombId: string, moduleId: string, input: FaultyBackgroundsInput) =>
  solveModule<FaultyBackgroundsInput, { output: FaultyBackgroundsOutput; solved: boolean }>(roundId, bombId, moduleId, input);
