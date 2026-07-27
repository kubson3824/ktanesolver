import { api, withErrorWrapping } from "../lib/api";

export interface FontSelectOutput {
  targetFont: string;
  actions: string[];
}

export const solveFontSelect = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  phrase: string,
  fonts: string[],
  currentFont: string,
) => withErrorWrapping(async () => (await api.post<{ output: FontSelectOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
  { input: { phrase, fonts, currentFont } },
)).data);
