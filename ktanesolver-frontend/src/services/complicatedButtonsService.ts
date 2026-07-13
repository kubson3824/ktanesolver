import { solveModule } from "../lib/api";

export type ComplicatedButtonsLabel = "PRESS" | "HOLD" | "DETONATE";

export interface ComplicatedButtonInput {
  label: ComplicatedButtonsLabel;
  red: boolean;
  blue: boolean;
}

export interface ComplicatedButtonsOutput {
  pressOrder: number[];
}

export const solveComplicatedButtons = (
  roundId: string,
  bombId: string,
  moduleId: string,
  buttons: ComplicatedButtonInput[],
) => solveModule<{ buttons: ComplicatedButtonInput[] }, { output: ComplicatedButtonsOutput; solved: boolean }>(
  roundId,
  bombId,
  moduleId,
  { buttons },
);
