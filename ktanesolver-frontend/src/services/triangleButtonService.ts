import { solveModule } from "../lib/api";

export interface TriangleButtonInput { color: string; direction: string; digit: number; label: string }
export interface TriangleButtonOutput { action: "TAP" | "HOLD" | "RELEASE"; targetDigit: number; holdDigit: number; releaseDigit: number }

export const solveTriangleButton = (roundId: string, bombId: string, moduleId: string, input: TriangleButtonInput) =>
  solveModule<TriangleButtonInput, { output: TriangleButtonOutput; solved: boolean }>(roundId, bombId, moduleId, input);
