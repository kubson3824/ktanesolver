import { api, withErrorWrapping } from "../lib/api";

export type TheMoonDirection = "NORTH" | "NORTHEAST" | "EAST" | "SOUTHEAST" | "SOUTH" | "SOUTHWEST" | "WEST" | "NORTHWEST";

export interface TheMoonOutput {
  pressSequence: string[];
}

export const solveTheMoon = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  firstLitPosition: TheMoonDirection,
) => withErrorWrapping(async () => (await api.post<{ output: TheMoonOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input: { firstLitPosition } },
)).data);
