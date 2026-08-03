import { api, withErrorWrapping } from "../lib/api";

export interface SimonSingsOutput {
  stage: number;
  press: string[];
}

export const solveSimonSings = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  flashes: string[],
): Promise<{ output: SimonSingsOutput; solved: boolean }> =>
  withErrorWrapping(async () => {
    const response = await api.post<{ output: SimonSingsOutput; solved: boolean }>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      { input: { flashes } },
    );
    return response.data;
  });
