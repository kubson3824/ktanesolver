import { api, withErrorWrapping } from "../lib/api";

export interface ExtendedPasswordOutput {
  possibleWords: string[];
  resolved: boolean;
}

export const solveExtendedPassword = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  letters: Record<number, string[]>,
) => withErrorWrapping(async () => (await api.post<{ output: ExtendedPasswordOutput }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input: { letters } },
)).data);
