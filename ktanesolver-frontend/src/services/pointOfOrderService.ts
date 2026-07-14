import { solveModule } from "../lib/api";

export interface PointOfOrderInput {
  cards: string[];
}

export interface PointOfOrderOutput {
  activeRules: number[];
  validCards: string[];
}

export const solvePointOfOrder = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: PointOfOrderInput,
) => solveModule<PointOfOrderInput, { output: PointOfOrderOutput; solved: boolean }>(roundId, bombId, moduleId, input);
