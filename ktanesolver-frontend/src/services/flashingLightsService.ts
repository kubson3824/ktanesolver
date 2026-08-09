import { solveModule } from "../lib/api";

export type FlashingLightsColor = "CYAN" | "GREEN" | "RED" | "PURPLE" | "ORANGE";
export interface FlashingLightsInput { top: FlashingLightsColor[]; bottom: FlashingLightsColor[] }
export interface FlashingLightsOutput { presses: number[]; topCounts: Record<FlashingLightsColor, number>; bottomCounts: Record<FlashingLightsColor, number> }
export const solveFlashingLights = (
  roundId: string, bombId: string, moduleId: string, input: FlashingLightsInput,
): Promise<{ output: FlashingLightsOutput; solved: boolean }> =>
  solveModule<FlashingLightsInput, { output: FlashingLightsOutput; solved: boolean }>(roundId, bombId, moduleId, input);
