import { solveModule } from "../lib/api";

export interface StreetFighterOutput {
  requiredLetter: string;
  fighter: string;
  opponent: string;
  eligibleFighters: string[];
}

export const solveStreetFighter = (
  roundId: string, bombId: string, moduleId: string,
): Promise<{ output: StreetFighterOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, {});
