import { solveModule } from "../lib/api";

export const BINARY_TREE_COLORS = [
  "RED", "GREEN", "BLUE", "ORANGE", "CYAN", "MAGENTA", "YELLOW", "GRAY",
] as const;

export interface BinaryTreeNodeInput {
  color: typeof BINARY_TREE_COLORS[number];
  character: string;
  silver: boolean;
}

export interface BinaryTreeInput {
  nodes: BinaryTreeNodeInput[];
}

export interface BinaryTreeOutput {
  presses: number[];
  referenceNodes: number[];
  orderings: string[];
}

export const solveBinaryTree = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: BinaryTreeInput,
): Promise<{ output: BinaryTreeOutput }> =>
  solveModule<BinaryTreeInput, { output: BinaryTreeOutput }>(roundId, bombId, moduleId, input);
