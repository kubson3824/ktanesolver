import { solveModule } from "../lib/api";

export interface NeutralButtonOutput { action: "BLINK"; windowMilliseconds: number; }

export const solveNeutralButton = (
  roundId: string, bombId: string, moduleId: string,
): Promise<{ output: NeutralButtonOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, {});
