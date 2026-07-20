import { solveModule } from "../lib/api";

export interface PaintingCellInput {
  label: string;
  color: string;
}

export interface PaintingInput {
  cells: PaintingCellInput[];
}

export interface PaintingRepaint {
  region: number;
  label: string;
  from: string;
  to: string;
}

export interface PaintingOutput {
  ruleset: string;
  creativityRule: boolean;
  repaints: PaintingRepaint[];
}

export const solvePainting = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: PaintingInput,
) => solveModule<PaintingInput, { output: PaintingOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
