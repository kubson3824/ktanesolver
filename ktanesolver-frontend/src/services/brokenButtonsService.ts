import { solveModule } from "../lib/api";

export interface BrokenButtonsOutput {
  action: "PRESS_BUTTON" | "SUBMIT";
  row: number | null;
  column: number | null;
  label: string | null;
  submitSide: "LEFT" | "RIGHT" | null;
  pressedCount: number;
}

export const solveBrokenButtons = (
  roundId: string,
  bombId: string,
  moduleId: string,
  labels: string[],
) => solveModule<{ labels: string[] }, { output: BrokenButtonsOutput; solved: boolean }>(
  roundId,
  bombId,
  moduleId,
  { labels },
);
