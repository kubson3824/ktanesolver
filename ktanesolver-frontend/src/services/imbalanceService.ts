import { solveModule } from "../lib/api";

export interface ImbalanceOutput {
  topValue: number;
  bottomValue: number;
  answer: number;
}

export const solveImbalance = (
  roundId: string, bombId: string, moduleId: string,
  topMarker: string, topDigits: string, bottomMarker: string, bottomDigits: string,
): Promise<{ output: ImbalanceOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { topMarker, topDigits, bottomMarker, bottomDigits });
