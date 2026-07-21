import { api, withErrorWrapping } from "../lib/api";

export interface RadiatorOutput {
  temperature: number;
  water: number;
}

export const solveRadiator = async (roundId: string, bombId: string, moduleId: string) =>
  withErrorWrapping(async () => (await api.post<{ output: RadiatorOutput; solved: boolean }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input: {} },
  )).data);
