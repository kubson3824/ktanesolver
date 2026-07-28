import { api, withErrorWrapping } from "../lib/api";

export type TheSunDirection = "NORTH" | "NORTHEAST" | "EAST" | "SOUTHEAST" | "SOUTH" | "SOUTHWEST" | "WEST" | "NORTHWEST";

export interface TheSunOutput {
  pressSequence: string[];
}

export const solveTheSun = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  ledPosition: TheSunDirection,
) => withErrorWrapping(async () => (await api.post<{ output: TheSunOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input: { ledPosition } },
)).data);
