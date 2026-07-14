import { solveModule } from "../lib/api";

export interface NeutralizationInput {
  acidColor: string;
  acidVolume: number;
}

export interface NeutralizationOutput {
  acidFormula: string;
  baseName: string;
  baseFormula: string;
  acidConcentration: number;
  baseConcentration: number;
  drops: number;
  filterOn: boolean;
}

export const solveNeutralization = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: NeutralizationInput,
) => solveModule<NeutralizationInput, { output: NeutralizationOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
