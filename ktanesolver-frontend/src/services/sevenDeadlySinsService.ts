import { solveModule } from "../lib/api";

export const SEVEN_DEADLY_SINS = ["LUST", "GLUTTONY", "GREED", "SLOTH", "WRATH", "ENVY", "PRIDE"] as const;
export type SevenDeadlySin = typeof SEVEN_DEADLY_SINS[number];
export interface SevenDeadlySinsOutput {
  pressSequence: SevenDeadlySin[];
  pressPositions: number[];
  twitchCommand: string;
}

export const solveSevenDeadlySins = (
  roundId: string, bombId: string, moduleId: string, sins: SevenDeadlySin[],
): Promise<{ output: SevenDeadlySinsOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { sins });
