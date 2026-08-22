import { solveModule } from "../lib/api";
export interface CrypticPasswordOutput { answer: string; effectiveKey: string; reversedKey: boolean; transposedTable: boolean }
export const solveCrypticPassword = (roundId: string, bombId: string, moduleId: string, startingWord: string, keyWord: string): Promise<{ output: CrypticPasswordOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { startingWord, keyWord });
