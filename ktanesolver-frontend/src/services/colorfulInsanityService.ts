import { solveModule } from "../lib/api";

export interface ColorfulInsanityButton {
  patternCell: number;
  blackRegionColor: string;
  otherRegionColor: string;
}

export interface ColorfulInsanityOutput {
  reversedPair: string[];
  identicalPair: string[];
  allowedPatternCells: number[];
  allowedColors: string[];
  pressCoordinates: string[];
  pairFallback: boolean;
}

export const solveColorfulInsanity = (
  roundId: string,
  bombId: string,
  moduleId: string,
  buttons: ColorfulInsanityButton[],
): Promise<{ output: ColorfulInsanityOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { buttons });
