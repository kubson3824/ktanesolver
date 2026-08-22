import { solveModule } from "../lib/api";
export type SimonStopsColor = "RED" | "ORANGE" | "YELLOW" | "GREEN" | "BLUE" | "VIOLET";
export interface SimonStopsInput { flashedColors: SimonStopsColor[]; normalPressesCompleted: number | null }
export interface SimonStopsOutput { stage: number; pressColors: SimonStopsColor[]; awaitingControlPosition: boolean; nextStage: number }
export const solveSimonStops = (roundId: string, bombId: string, moduleId: string, input: SimonStopsInput) => solveModule<SimonStopsInput, { output: SimonStopsOutput; solved: boolean }>(roundId, bombId, moduleId, input);
