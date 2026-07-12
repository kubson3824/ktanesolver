import { api, withErrorWrapping } from "../lib/api";

export interface TicTacToeInput {
  board: string[];
  nextPiece: "X" | "O";
  strike: boolean;
}

export interface TicTacToeOutput {
  action: "PRESS" | "PASS";
  position: number | null;
  number: number | null;
  row: number;
  automaticPlacement: boolean;
}

export const solveTicTacToe = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: TicTacToeInput,
): Promise<{ output: TicTacToeOutput; solved: boolean }> => withErrorWrapping(async () => {
  const response = await api.post<{ output: TicTacToeOutput; solved: boolean }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
    { input },
  );
  return response.data;
});
