import { api, withErrorWrapping } from "../lib/api";

export interface BrailleOutput {
  word: string;
  pressPosition: number;
}

export const solveBraille = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  patterns: number[],
) => withErrorWrapping(async () => (await api.post<{ output: BrailleOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input: { patterns } },
)).data);
