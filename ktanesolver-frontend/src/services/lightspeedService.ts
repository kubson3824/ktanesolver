import { solveModule } from "../lib/api";

export interface LightspeedInput {
  symbol: "C" | "L" | "P";
  symbolColor: "YELLOW" | "ORANGE" | "PURPLE";
  greenPoint: "NW" | "NE" | "SE" | "SW";
  antimatter: number; dilithium: number; shields: number;
  stardate: number; subStardate: number;
  planets: string[]; officers: string[];
}
export interface LightspeedOutput {
  quadrant: string; warpSpeed: number; planet: string; planetClass: string;
  officer: string; officerRank: string; encryptionCode: string;
}
export const solveLightspeed = (roundId: string, bombId: string, moduleId: string, input: LightspeedInput):
Promise<{ output: LightspeedOutput; solved: boolean }> =>
  solveModule<LightspeedInput, { output: LightspeedOutput; solved: boolean }>(roundId, bombId, moduleId, input);
