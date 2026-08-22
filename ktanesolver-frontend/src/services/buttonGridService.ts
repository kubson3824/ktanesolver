import { solveModule } from "../lib/api";
export type ButtonGridColor = "RED" | "BLUE" | "YELLOW" | "GREEN";
export interface ButtonGridInput { colors: ButtonGridColor[] }
export interface ButtonGridOutput { positions: number[]; stageOrders: ButtonGridColor[][]; instantSolve: boolean }
export const solveButtonGrid = (roundId: string, bombId: string, moduleId: string, input: ButtonGridInput) => solveModule<ButtonGridInput, { output: ButtonGridOutput; solved: boolean }>(roundId, bombId, moduleId, input);
