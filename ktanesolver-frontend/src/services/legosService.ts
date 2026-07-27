import { solveModule } from "../lib/api";

export type LegoColor = "RED" | "GREEN" | "BLUE" | "CYAN" | "MAGENTA" | "YELLOW";
export type LegoSize = "2×2" | "3×1" | "3×2" | "4×1" | "4×2";
export type LegoPiece = { color: LegoColor; width: number; depth: number; rotated: boolean };
export type LegoConnection = { bottom: LegoColor; top: LegoColor; offsetX: number; offsetY: number };

export interface LegosInput {
  pieces: LegoPiece[];
  connections: LegoConnection[];
}

export interface LegosOutput {
  cells: Array<LegoColor | "EMPTY">;
  face: "TOP" | "BOTTOM";
  orientation: "NORTH" | "EAST" | "SOUTH" | "WEST";
}

export const solveLegos = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: LegosInput,
) => solveModule<LegosInput, { output: LegosOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
