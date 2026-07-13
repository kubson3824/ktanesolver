import { api, withErrorWrapping } from "../lib/api";

export interface WordSearchOutput {
  words: string[];
}

export const solveWordSearch = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  corners: string,
  confirmed = false,
) => withErrorWrapping(async () => (await api.post<{ output: WordSearchOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input: { corners, confirmed } },
)).data);
