import { solveModule } from "../lib/api";

export type BooleanOperator = "AND" | "OR" | "XOR" | "IMPLIES" | "NAND" | "NOR" | "XNOR" | "IMPLIED_BY";
export type BooleanVennGrouping = "AB_FIRST" | "BC_FIRST";

export interface BooleanVennDiagramOutput {
  expression: string;
  regions: string[];
}

export interface BooleanVennDiagramInput {
  firstOperator: BooleanOperator;
  secondOperator: BooleanOperator;
  grouping: BooleanVennGrouping;
}

export const solveBooleanVennDiagram = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: BooleanVennDiagramInput,
) => solveModule<typeof input, { output: BooleanVennDiagramOutput; solved: boolean }>(roundId, bombId, moduleId, input);
