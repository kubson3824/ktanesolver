import { api, withErrorWrapping } from "../lib/api";

export type ColoredSwitchColor = "RED" | "GREEN" | "BLUE" | "PURPLE" | "ORANGE" | "TURQUOISE";

export interface ColoredSwitchesInput {
  switchColors: ColoredSwitchColor[];
  currentSwitches: boolean[];
  ledPositions: boolean[] | null;
}

export interface ColoredSwitchesOutput {
  solutionSteps: number[];
  enterLedPositions: boolean;
  instruction: string;
}

export const solveColoredSwitches = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: ColoredSwitchesInput,
) => withErrorWrapping(async () => (await api.post<{ output: ColoredSwitchesOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
)).data);
