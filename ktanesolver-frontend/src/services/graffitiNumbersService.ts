import { api, withErrorWrapping } from "../lib/api";

export type GraffitiNumberColor = "RED" | "GREEN" | "BLUE" | "YELLOW";

export interface GraffitiNumbersOutput {
  pressNumbers: number[];
  buttonPositions: number[];
}

export const solveGraffitiNumbers = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  numbers: number[],
  colors: GraffitiNumberColor[],
) => withErrorWrapping(async () => (await api.post<{ output: GraffitiNumbersOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
  { input: { numbers, colors } },
)).data);
