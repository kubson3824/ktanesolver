import { solveModule } from "../lib/api";

export interface YahtzeeInput {
  dice: number[];
}

export interface YahtzeeOutput {
  rollNumber: number;
  action: "SOLVED" | "ROLL_ALL" | "KEEP_AND_ROLL";
  keepColors: string[];
  rerollColors: string[];
}

export const solveYahtzee = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: YahtzeeInput,
) => solveModule<YahtzeeInput, { output: YahtzeeOutput; solved: boolean }>(roundId, bombId, moduleId, input);
