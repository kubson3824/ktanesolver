import { solveModule } from "../lib/api";

export interface DigitalCipherOutput { displayedString: string; pressSequence: string }
export const solveDigitalCipher = (
  roundId: string, bombId: string, moduleId: string, displayedString: string,
): Promise<{ output: DigitalCipherOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { displayedString });
