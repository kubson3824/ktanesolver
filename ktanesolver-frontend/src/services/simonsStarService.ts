import { solveModule } from "../lib/api";

export const SIMONS_STAR_COLORS = ["BLUE", "GREEN", "PURPLE", "RED", "YELLOW"] as const;
export type SimonsStarColor = typeof SIMONS_STAR_COLORS[number];

export interface SimonsStarInput {
  buttonColors: SimonsStarColor[];
  flash: SimonsStarColor;
  digit: number;
}

export interface SimonsStarOutput {
  stage: number;
  presses: SimonsStarColor[];
}

export const solveSimonsStar = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: SimonsStarInput,
): Promise<{ output: SimonsStarOutput; solved: boolean }> =>
  solveModule<SimonsStarInput, { output: SimonsStarOutput; solved: boolean }>(roundId, bombId, moduleId, input);
