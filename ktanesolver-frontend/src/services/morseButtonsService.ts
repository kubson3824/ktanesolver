import { solveModule } from "../lib/api";
export interface MorseButton { color: string; morse: string }
export interface MorseButtonsInput { buttons: MorseButton[] }
export interface MorseButtonsOutput { pressPositions: number[]; ruleNumbers: number[]; characters: string[]; colors: string[] }
export const solveMorseButtons = (roundId: string, bombId: string, moduleId: string, input: MorseButtonsInput) => solveModule<MorseButtonsInput, { output: MorseButtonsOutput; solved: boolean }>(roundId, bombId, moduleId, input);
