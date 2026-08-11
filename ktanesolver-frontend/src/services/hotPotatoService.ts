import { solveModule } from "../lib/api";
export interface HotPotatoOutput { action: "DROP_BOMB" | "KEEP_BOMB_DROPPED" }
export const solveHotPotato = (roundId: string, bombId: string, moduleId: string, active: boolean, bombHeld: boolean): Promise<{ output: HotPotatoOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { active, bombHeld });
