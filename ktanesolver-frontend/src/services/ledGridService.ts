import { api, withErrorWrapping } from "../lib/api";

export type LedGridColor = "RED" | "BLUE" | "YELLOW" | "GREEN" | "ORANGE" | "PINK" | "PURPLE" | "WHITE" | "UNLIT";

export interface LedGridOutput {
  pressOrder: string[];
  unlitCount: number;
}

export const solveLedGrid = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  colors: LedGridColor[],
) => withErrorWrapping(async () => (await api.post<{ output: LedGridOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input: { colors } },
)).data);
