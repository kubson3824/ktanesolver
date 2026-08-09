import { solveModule } from "../lib/api";

export type LootColor = "NORMAL" | "RED" | "BLUE";
export interface SplittingTheLootInput { bags: string[]; coloredBag: number; coloredBagColor: "RED" | "BLUE" }
export interface SplittingTheLootOutput { colors: LootColor[]; values: number[]; totalPerTeam: number; coloredBag: number }

export const solveSplittingTheLoot = (
  roundId: string, bombId: string, moduleId: string, input: SplittingTheLootInput,
): Promise<{ output: SplittingTheLootOutput; solved: boolean }> =>
  solveModule<SplittingTheLootInput, { output: SplittingTheLootOutput; solved: boolean }>(roundId, bombId, moduleId, input);
