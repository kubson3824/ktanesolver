import { solveModule } from "../lib/api";

export const ELDER_FUTHARK_RUNES = ["Ansuz","Berkana","Kenaz","Dagaz","Ehwaz","Fehu","Gebo","Hagalaz","Isa","Jera","Eihwaz","Laguz","Mannaz","Nauthiz","Othila","Perthro","Algiz","Raido","Sowulo","Teiwaz","Uruz","Wunjo","Thurisaz"];
export interface ElderFutharkOutput { shownRunes: string[]; encryptionKey: string; encryptedRunes: string[][]; pressSequence: string[] }
export const solveElderFuthark = (
  roundId: string, bombId: string, moduleId: string, runeNames: string[],
): Promise<{ output: ElderFutharkOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { runeNames });
