import { api, withErrorWrapping } from "../lib/api";

export interface X01Output {
  targetScore: number;
  dartCount: number;
  restrictions: string;
  darts: string[];
}

export const solveX01 = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  segmentValues: number[],
) => withErrorWrapping(async () => (await api.post<{ output: X01Output; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
  { input: { segmentValues } },
)).data);
