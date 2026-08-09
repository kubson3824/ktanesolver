import { solveModule } from "../lib/api";

export const KNOW_YOUR_WAY_DIRECTIONS = ["UP", "LEFT", "DOWN", "RIGHT"] as const;
export const KNOW_YOUR_WAY_LABELS = ["U", "L", "D", "R"] as const;
export type KnowYourWayDirection = typeof KNOW_YOUR_WAY_DIRECTIONS[number];
export type KnowYourWayLabel = typeof KNOW_YOUR_WAY_LABELS[number];

export interface KnowYourWayInput {
  ledPosition: KnowYourWayDirection;
  arrowDirection: KnowYourWayDirection;
  upperButtonLabel: KnowYourWayLabel;
}

export interface KnowYourWayOutput {
  presses: string[];
  indications: string[];
  orientations: string[];
}

export const solveKnowYourWay = (
  roundId: string, bombId: string, moduleId: string, input: KnowYourWayInput,
): Promise<{ output: KnowYourWayOutput; solved: boolean }> =>
  solveModule<KnowYourWayInput, { output: KnowYourWayOutput; solved: boolean }>(roundId, bombId, moduleId, input);
