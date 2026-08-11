import { solveModule } from "../lib/api";
export interface TennisSetScore { player1: number; player2: number }
export interface TennisInput { tournament: "FRENCH_OPEN" | "US_OPEN" | "WIMBLEDON"; mensPlay: boolean; sets: TennisSetScore[]; mode: "NORMAL" | "DEUCE" | "ADVANTAGE_P1" | "ADVANTAGE_P2" | "TIE_BREAK"; player1Score: number; player2Score: number }
export interface TennisOutput { binary: string; winner: number | null; sets: TennisSetScore[]; mode: string; player1Score: number; player2Score: number; actions: string[] }
export const solveTennis = (roundId: string, bombId: string, moduleId: string, input: TennisInput): Promise<{ output: TennisOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, input);
