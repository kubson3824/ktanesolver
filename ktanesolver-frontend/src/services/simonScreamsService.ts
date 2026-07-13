import { api, withErrorWrapping } from "../lib/api";

export type SimonScreamsColor = "RED" | "ORANGE" | "YELLOW" | "GREEN" | "BLUE" | "PURPLE";

export interface SimonScreamsOutput {
  stage: number;
  press: SimonScreamsColor[];
  rule: string;
}

export const solveSimonScreams = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  stage: number,
  clockwiseColors: SimonScreamsColor[],
  flashes: SimonScreamsColor[],
): Promise<{ output: SimonScreamsOutput; solved: boolean }> =>
  withErrorWrapping(async () => {
    const response = await api.post<{ output: SimonScreamsOutput; solved: boolean }>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      { input: { stage, clockwiseColors, flashes } },
    );
    return response.data;
  });
