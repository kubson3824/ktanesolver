import { solveModule } from "../lib/api";

export const TIME_KEEPER_COLORS = ["RED", "YELLOW", "BLUE", "GREEN", "BLACK", "WHITE"] as const;
export type TimeKeeperColor = typeof TIME_KEEPER_COLORS[number];

export interface TimeKeeperInput {
  displayedNumber: number;
  displayedColor: TimeKeeperColor;
  ledColors: TimeKeeperColor[];
  activationMonth: number;
}

export interface TimeKeeperOutput {
  correctLed: number;
  finalNumber: number;
}

export const solveTimeKeeper = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: TimeKeeperInput,
): Promise<{ output: TimeKeeperOutput; solved: boolean }> =>
  solveModule<TimeKeeperInput, { output: TimeKeeperOutput; solved: boolean }>(roundId, bombId, moduleId, input);
