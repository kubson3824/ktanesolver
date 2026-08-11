import { solveModule } from "../lib/api";

export const MANOMETER_COLORS = ["BLUE", "GREEN", "RED"] as const;
export const MANOMETER_SCREEN_COLORS = ["BLUE", "ORANGE", "BLACK", "YELLOW", "MAGENTA"] as const;
export const MANOMETER_BUTTON_COLORS = ["BLUE", "ORANGE", "YELLOW"] as const;
export type ManometerColor = typeof MANOMETER_COLORS[number];
export interface ManometersInput {
  stage: number;
  screenColor?: string;
  minusColor?: string;
  plusColor?: string;
  blueScreenSeenPreviously?: boolean;
  orangeScreenSeenPreviously?: boolean;
  topColor?: string;
  bottomLeftColor?: string;
  bottomRightColor?: string;
  underFiveMinutes?: boolean;
  month?: number;
  day?: number;
  dayOfWeek?: number;
  hour?: number;
}
export interface ManometersOutput {
  stage: number; targetPressure: number;
  topMaximum: number | null; bottomLeftMaximum: number | null; bottomRightMaximum: number | null;
  topPressure: number | null; bottomLeftPressure: number | null; bottomRightPressure: number | null;
  useValve: boolean;
}
export const solveManometers = (
  roundId: string, bombId: string, moduleId: string, input: ManometersInput,
): Promise<{ output: ManometersOutput; solved: boolean }> =>
  solveModule<ManometersInput, { output: ManometersOutput; solved: boolean }>(roundId, bombId, moduleId, input);
