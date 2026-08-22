import { solveModule } from "../lib/api";

export interface TheHexabuttonOutput { action: string; needsLightObservation: boolean; timingCondition: string; suggestedTime: string | null; lightType: string | null; lightColor: string | null; morseLetter: string | null }
export const solveTheHexabutton = (
  roundId: string, bombId: string, moduleId: string, input: { label: string; buttonColor: string; twoFactorCodes: number[]; lightType: string | null; lightColor: string | null; morseLetter: string | null },
): Promise<{ output: TheHexabuttonOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, input);
