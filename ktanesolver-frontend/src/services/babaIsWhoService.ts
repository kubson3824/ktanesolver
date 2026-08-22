import { solveModule } from "../lib/api";
export type BabaCharacter = "BABA" | "KEKE" | "ME" | "ROCK" | "FLAG" | "WALL";
export type BabaAttribute = "YOU" | "MOVE" | "DEFEAT" | "PUSH" | "WIN" | "STOP";
export interface BabaRule { subject: BabaCharacter; attribute: BabaAttribute }
export interface BabaButton { character: BabaCharacter; attribute: BabaAttribute }
export interface BabaIsWhoInput { rules: BabaRule[]; buttons: BabaButton[] }
export interface BabaIsWhoOutput { position: number; character: BabaCharacter; attribute: BabaAttribute; appliedRule: number | null; defeatShifted: boolean }
export const solveBabaIsWho = (roundId: string, bombId: string, moduleId: string, input: BabaIsWhoInput) => solveModule<BabaIsWhoInput, { output: BabaIsWhoOutput; solved: boolean }>(roundId, bombId, moduleId, input);
