import { solveModule } from "../lib/api";

export interface ColorGeneratorOutput {
  red: number;
  green: number;
  blue: number;
}

export const solveColorGenerator = (roundId: string, bombId: string, moduleId: string) =>
  solveModule<Record<string, never>, { output: ColorGeneratorOutput; solved: boolean }>(roundId, bombId, moduleId, {});
