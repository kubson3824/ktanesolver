import { api, withErrorWrapping } from '../lib/api';

export interface PasswordInput {
  letters: Record<number, string[]>;
}

export interface PasswordOutput {
  possibleWords: string[];
  resolved: boolean;
}

export async function solvePassword(
  roundId: string,
  bombId: string,
  moduleId: string,
  data: { input: PasswordInput }
): Promise<{ output: PasswordOutput }> {
  return withErrorWrapping(async () => {
    const response = await api.post(`/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, data);
    return response.data;
  });
}
