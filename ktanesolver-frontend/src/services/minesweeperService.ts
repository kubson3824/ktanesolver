import { api, withErrorWrapping } from "../lib/api";

export interface MinesweeperInput {
  colors: string[];
  board: string[] | null;
}

export interface MinesweeperOutput {
  startingCell: string;
  startingColor: string;
  mines: string[];
  safeCells: string[];
}

export const solveMinesweeper = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: MinesweeperInput,
) => withErrorWrapping(async () => (await api.post<{ output: MinesweeperOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
)).data);
