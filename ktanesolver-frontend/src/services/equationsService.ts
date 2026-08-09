import { solveModule } from "../lib/api";

export const EQUATION_COLORS = ["BLUE", "RED", "PINK", "YELLOW", "GREEN"] as const;
export type EquationColor = typeof EQUATION_COLORS[number];
export interface EquationsInput { keyColors: EquationColor[]; leds: boolean[] }
export interface EquationsOutput {
  system: number; variable: "x" | "y"; a: number; b: number; c: number; d: number;
  answer: string; blank: boolean;
}

export const solveEquations = (
  roundId: string, bombId: string, moduleId: string, input: EquationsInput,
): Promise<{ output: EquationsOutput; solved: boolean }> =>
  solveModule<EquationsInput, { output: EquationsOutput; solved: boolean }>(roundId, bombId, moduleId, input);
