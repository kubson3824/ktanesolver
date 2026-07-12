import { api, withErrorWrapping } from "../lib/api";

export interface BlindAlleyOutput {
  regions: string[];
  conditionCounts: Record<string, number>;
}

export const solveBlindAlley = async (roundId: string, bombId: string, moduleId: string) =>
  withErrorWrapping(async () => (await api.post<{ output: BlindAlleyOutput; solved: boolean }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input: {} },
  )).data);
