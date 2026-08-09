import { solveModule } from "../lib/api";

export const MINESEEKER_IMAGES = ["6", "6o", "10", "11", "85", "100", "63214"] as const;
export const MINESEEKER_COLORS = [
  "WHITE", "GRAY", "PINK", "RED", "BRICK_RED", "BROWN", "ORANGE",
  "YELLOW", "LIME", "FOREST_GREEN", "CYAN", "BLUE", "LAVENDER", "PURPLE",
] as const;
export type MineseekerImage = typeof MINESEEKER_IMAGES[number];
export type MineseekerColor = typeof MINESEEKER_COLORS[number];

export interface MineseekerInput {
  startImage: MineseekerImage;
  backgroundColor: MineseekerColor;
  twoFactorCodes: number[];
}

export interface MineseekerOutput {
  calculatedNumber: number;
  destinationImage: MineseekerImage;
  moves: string[];
}

export const mineseekerImageUrl = (image: string) =>
  `https://ktane.timwi.de/HTML/img/Mineseeker/${image}.png`;

export const solveMineseeker = (
  roundId: string, bombId: string, moduleId: string, input: MineseekerInput,
): Promise<{ output: MineseekerOutput; solved: boolean }> =>
  solveModule<MineseekerInput, { output: MineseekerOutput; solved: boolean }>(roundId, bombId, moduleId, input);
