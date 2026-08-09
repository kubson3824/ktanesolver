import { solveModule } from "../lib/api";

export interface AlphabetNumbersInput { labels: number[] }
export interface AlphabetNumbersOutput { stage: number; presses: number[]; nextStage: number }

export const solveAlphabetNumbers = (
  roundId: string, bombId: string, moduleId: string, input: AlphabetNumbersInput,
): Promise<{ output: AlphabetNumbersOutput; solved: boolean }> =>
  solveModule<AlphabetNumbersInput, { output: AlphabetNumbersOutput; solved: boolean }>(roundId, bombId, moduleId, input);
