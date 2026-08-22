import { solveModule } from "../lib/api";

export interface PassportControlOutput { ruleDate: string; activeRestrictions: string[]; decision: string; reasons: string[]; passageNumber: number }
export interface PassportControlInput { successfulPassages: number; arstotzkan: boolean; flightType: string; birthDay: number; birthMonth: number; birthYear: number; expirationDay: number; expirationMonth: number; expirationYear: number }
export const solvePassportControl = (
  roundId: string, bombId: string, moduleId: string, input: PassportControlInput,
): Promise<{ output: PassportControlOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, input);
