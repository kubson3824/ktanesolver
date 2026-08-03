import { solveModule } from "../lib/api";

export type LogicalButtonColor =
  | "RED" | "BLUE" | "GREEN" | "YELLOW" | "PURPLE" | "WHITE" | "ORANGE" | "CYAN" | "GREY";
export type LogicalButtonLabel =
  | "LOGIC" | "COLOR" | "LABEL" | "BUTTON" | "WRONG" | "BOOM" | "NO" | "WAIT" | "HMMM";
export type LogicalOperator = "AND" | "OR" | "XOR" | "NAND" | "NOR" | "XNOR";

export interface LogicalButtonInput {
  color: LogicalButtonColor;
  label: LogicalButtonLabel;
}

export interface LogicalButtonsInput {
  operator: LogicalOperator;
  buttons: LogicalButtonInput[];
}

export interface LogicalButtonsOutput {
  stage: number;
  pressButtons: number[];
  pressOperator: boolean;
}

export const solveLogicalButtons = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: LogicalButtonsInput,
) => solveModule<LogicalButtonsInput, { output: LogicalButtonsOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
