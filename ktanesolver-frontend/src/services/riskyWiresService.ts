import { solveModule } from "../lib/api";
export type RiskyWireColor = "RED" | "BLUE" | "YELLOW" | "GREEN" | "PURPLE";
export type RiskyLedColor = "OFF" | "RED" | "GREEN";
export interface RiskyWiresInput { idNumber: string; topLed: RiskyLedColor; bottomLed: RiskyLedColor; wireColors: RiskyWireColor[]; failedGambleAttempt: number }
export interface RiskyWiresOutput { cutPositions: number[]; reversedSixWireRules: boolean; shiftedEightWireRules: boolean }
export const solveRiskyWires = (roundId: string, bombId: string, moduleId: string, input: RiskyWiresInput) => solveModule<RiskyWiresInput, { output: RiskyWiresOutput; solved: boolean }>(roundId, bombId, moduleId, input);
