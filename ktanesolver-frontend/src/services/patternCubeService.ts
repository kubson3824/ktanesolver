import { solveModule } from "../lib/api";

export interface PatternCubeSymbolInput { symbol: string; orientation: number }
export interface PatternCubeInput {
  group1: number; group2: number; netCells: string[]; cellLetters: Record<string, string>;
  givenCell: string; givenSymbol: string; givenOrientation: number;
  highlightedCell: string; highlightedSymbol: string; selections: PatternCubeSymbolInput[];
}
export interface PatternCubePlacement {
  selection: number; symbol: string; targetCell: string; targetLetter: string;
  currentOrientation: number; targetOrientation: number; rotation: string;
}
export interface PatternCubeOutput { placements: PatternCubePlacement[] }

export const solvePatternCube = (
  roundId: string, bombId: string, moduleId: string, input: PatternCubeInput,
): Promise<{ output: PatternCubeOutput; solved: boolean }> =>
  solveModule<PatternCubeInput, { output: PatternCubeOutput; solved: boolean }>(roundId, bombId, moduleId, input);
