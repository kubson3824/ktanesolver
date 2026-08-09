import { solveModule } from "../lib/api";

export interface CharacterShiftInput { letters: string[]; digits: number[] }
export interface CharacterShiftSolution { letter: string; digit: number; shiftedLetter: string }
export interface CharacterShiftOutput { solutions: CharacterShiftSolution[]; x: number; y: number }

export const solveCharacterShift = (
  roundId: string, bombId: string, moduleId: string, input: CharacterShiftInput,
): Promise<{ output: CharacterShiftOutput; solved: boolean }> =>
  solveModule<CharacterShiftInput, { output: CharacterShiftOutput; solved: boolean }>(roundId, bombId, moduleId, input);
