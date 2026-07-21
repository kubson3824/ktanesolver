import { solveModule } from "../lib/api";

export const SYMBOLIC_COORDINATE_SYMBOLS = ["A", "C", "E", "L", "P"] as const;
export const SYMBOLIC_COORDINATE_COLORS = ["AQUA", "GREEN", "PURPLE", "YELLOW"] as const;

export type SymbolicCoordinateSymbol = typeof SYMBOLIC_COORDINATE_SYMBOLS[number];
export type SymbolicCoordinateColor = typeof SYMBOLIC_COORDINATE_COLORS[number];
export const SYMBOLIC_COORDINATE_SYMBOL_LABELS: Record<SymbolicCoordinateSymbol, string> = {
  A: "Spiral",
  C: "Dot",
  E: "Waves",
  L: "Pinwheel",
  P: "Broken rings",
};

export interface SymbolicCoordinatesInput {
  symbols: SymbolicCoordinateSymbol[];
  ledColors: SymbolicCoordinateColor[];
  confirmStage: boolean;
}

export interface SymbolicCoordinatesOutput {
  stage: number;
  coordinate: string;
  confirmed: boolean;
}

export const solveSymbolicCoordinates = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: SymbolicCoordinatesInput,
) => solveModule<SymbolicCoordinatesInput, { output: SymbolicCoordinatesOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
