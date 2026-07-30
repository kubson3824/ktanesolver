import { solveModule } from "../lib/api";

export type TheCubeRotation =
  | "ROTATE_CLOCKWISE"
  | "TIP_LEFT"
  | "TIP_BACKWARDS"
  | "ROTATE_COUNTERCLOCKWISE"
  | "TIP_RIGHT"
  | "TIP_FORWARDS";

export type TheCubeColor = "BLUE" | "GREEN" | "ORANGE" | "PURPLE" | "RED" | "WHITE";

export interface TheCubeButton {
  color: TheCubeColor;
  label: string;
}

export interface TheCubeInput {
  rotations: TheCubeRotation[];
  faces: number[];
  wires: TheCubeColor[];
  buttons: TheCubeButton[];
  executeButton: TheCubeButton;
  cipherTwo: string;
  cipherThree: string;
}

export interface TheCubeStageSolution {
  stage: number;
  cipherDigit: number;
  buttons: number[];
}

export interface TheCubeOutput {
  cipherOne: string;
  finalCipher: string;
  stages: TheCubeStageSolution[];
}

export const solveTheCube = (roundId: string, bombId: string, moduleId: string, input: TheCubeInput) =>
  solveModule<TheCubeInput, { output: TheCubeOutput; solved: boolean }>(roundId, bombId, moduleId, input);
