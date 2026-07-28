import { api, withErrorWrapping } from "../lib/api";

export interface GridMatchingOutput {
  letter: string;
  actions: string[];
}

export const solveGridMatching = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  grid: boolean[],
  focusRow: number,
  focusColumn: number,
) => withErrorWrapping(async () => (await api.post<{ output: GridMatchingOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
  { input: { grid, focusRow, focusColumn } },
)).data);
