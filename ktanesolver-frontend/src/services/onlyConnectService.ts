import { solveModule } from "../lib/api";

export interface OnlyConnectInput {
  round: number;
  teamName: string | null;
  hieroglyphs: string[] | null;
  letters: string[] | null;
}

export interface OnlyConnectGroup {
  language: string;
  letters: string[];
}

export interface OnlyConnectOutput {
  round: number;
  hieroglyph: string | null;
  position: number | null;
  groups: OnlyConnectGroup[];
}

export const solveOnlyConnect = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: OnlyConnectInput,
) => solveModule<OnlyConnectInput, { output: OnlyConnectOutput; solved: boolean }>(roundId, bombId, moduleId, input);
