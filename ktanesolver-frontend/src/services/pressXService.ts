import { solveModule } from "../lib/api";

export type PressXInput = object;

export interface PressXOutput {
  button: "X" | "Y" | "A" | "B" | "ANY";
  timing: string;
  validSeconds: number[];
  anyTime: boolean;
  instruction: string;
}

export const solvePressX = (roundId: string, bombId: string, moduleId: string) =>
  solveModule<PressXInput, { output: PressXOutput; solved: boolean }>(roundId, bombId, moduleId, {});
