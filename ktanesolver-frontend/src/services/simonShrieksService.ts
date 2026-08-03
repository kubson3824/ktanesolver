import { api, withErrorWrapping } from "../lib/api";

export type SimonShrieksColor = "RED" | "YELLOW" | "GREEN" | "CYAN" | "BLUE" | "WHITE" | "MAGENTA";

export interface SimonShrieksSolveResponse {
  output: { presses: SimonShrieksColor[] };
  solved: boolean;
}

export const solveSimonShrieks = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  stage: number,
  flashes: number[],
): Promise<SimonShrieksSolveResponse> => withErrorWrapping(async () => {
  const response = await api.post<SimonShrieksSolveResponse>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
    { input: { stage, flashes } },
  );
  return response.data;
});
