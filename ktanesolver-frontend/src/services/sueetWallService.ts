import { solveModule } from "../lib/api";

export interface SueetWallButton { suit: string; number: number; numberColor: string }
export interface SueetWallOutput { pressCoordinates: string[]; anyButtonAllowed: boolean }
export const solveSueetWall = (
  roundId: string, bombId: string, moduleId: string, initialBombMinutes: number, buttons: SueetWallButton[],
): Promise<{ output: SueetWallOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { initialBombMinutes, buttons });
