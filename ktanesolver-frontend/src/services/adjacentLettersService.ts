import { solveModule } from "../lib/api";

export interface AdjacentLettersOutput {
  pressLetters: string[];
}

export const solveAdjacentLetters = (
  roundId: string,
  bombId: string,
  moduleId: string,
  letters: string[],
) => solveModule<{ letters: string[] }, { output: AdjacentLettersOutput; solved: boolean }>(
  roundId,
  bombId,
  moduleId,
  { letters },
);
