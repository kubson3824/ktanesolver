import { solveModule } from "../lib/api";

export interface TheMatrixInput { firstAccessCode: string; secondAccessCode: string; words: string[] }
export interface TheMatrixOutput { accessCodeNames: string[]; accessSeconds: number; listNumber: number; glitchWord: string; pill: "RED" | "BLUE"; timerDigit: number }
export const solveTheMatrix = (roundId: string, bombId: string, moduleId: string, input: TheMatrixInput) => solveModule<TheMatrixInput, { output: TheMatrixOutput; solved: boolean }>(roundId, bombId, moduleId, input);
