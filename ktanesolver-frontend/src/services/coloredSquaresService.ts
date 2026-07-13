import { api, withErrorWrapping } from "../lib/api";

export type ColoredSquaresGroup = "RED" | "BLUE" | "GREEN" | "YELLOW" | "MAGENTA" | "ROW" | "COLUMN";

export interface ColoredSquaresInput {
  whiteCount: number;
  previousGroup: ColoredSquaresGroup;
}

export interface ColoredSquaresOutput {
  group: ColoredSquaresGroup | null;
}

export const solveColoredSquares = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: ColoredSquaresInput,
) => withErrorWrapping(async () => (await api.post<{ output: ColoredSquaresOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
)).data);
