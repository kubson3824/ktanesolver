import { solveModule } from "../lib/api";

export interface ColorMorseInput {
  characters: string[];
  colors: string[];
  operators: string[];
  parentheses: string;
}

export interface ColorMorseOutput {
  answer: number;
  transformedValues: number[];
  evaluatedExpression: string;
  morse: string[];
}

export const solveColorMorse = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: ColorMorseInput,
): Promise<{ output: ColorMorseOutput }> =>
  solveModule<ColorMorseInput, { output: ColorMorseOutput }>(roundId, bombId, moduleId, input);
