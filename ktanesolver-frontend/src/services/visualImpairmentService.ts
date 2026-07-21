import { solveModule } from "../lib/api";

export interface VisualImpairmentInput {
  shades: number[];
  desiredColor: string;
  stageComplete: boolean;
  moduleSolved: boolean;
}

export interface VisualImpairmentOutput {
  positions: string[];
  pictureNumber: number;
  stage: number;
}

export const solveVisualImpairment = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: VisualImpairmentInput,
) => solveModule<VisualImpairmentInput, { output: VisualImpairmentOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
