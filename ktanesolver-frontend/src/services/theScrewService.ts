import { solveModule } from "../lib/api";

export interface TheScrewInput {
  holeColors: string[];
  buttonLabels: string[];
}

export interface TheScrewOutput {
  stage: number;
  hole: number;
  holeColor: string;
  buttonPosition: number;
  buttonLabel: string;
}

export const solveTheScrew = (roundId: string, bombId: string, moduleId: string, input: TheScrewInput) =>
  solveModule<TheScrewInput, { output: TheScrewOutput; solved: boolean }>(roundId, bombId, moduleId, input);
