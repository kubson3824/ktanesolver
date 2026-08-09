import { api, withErrorWrapping } from "../lib/api";

export interface LasersOutput {
  positions: number[];
  labels: number[];
}

export const solveLasers = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  labels: number[],
  startingTimeMinutes: number,
) => withErrorWrapping(async () => (await api.post<{ output: LasersOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
  { input: { labels, startingTimeMinutes } },
)).data);
