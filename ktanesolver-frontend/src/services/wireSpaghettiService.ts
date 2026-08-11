import { solveModule } from "../lib/api";

export const WIRE_SPAGHETTI_COLORS = ["PURPLE", "LIME", "DARK RED", "WHITE", "GREEN", "ORANGE", "BLUE", "YELLOW", "LIGHT RED", "BLACK", "DARK GREY", "PINK", "AQUA", "BROWN", "LIGHT GREY"] as const;

export interface WireSpaghettiOutput { colors: string[]; aliases: string[] }

export const solveWireSpaghetti = (roundId: string, bombId: string, moduleId: string, wires: string[]): Promise<{ output: WireSpaghettiOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { wires });
