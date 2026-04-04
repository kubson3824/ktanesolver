import { api, withErrorWrapping } from "../lib/api";

export type SimonStatesColor = "RED" | "BLUE" | "GREEN" | "YELLOW";

export interface SimonStatesSolveRequest {
  input: {
    stage: number;
    topLeft: SimonStatesColor;
    flashes: SimonStatesColor[];
  };
}

export interface SimonStatesSolveResponse {
  output: {
    press: SimonStatesColor;
  };
  solved: boolean;
}

export const solveSimonStates = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: SimonStatesSolveRequest
): Promise<SimonStatesSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<SimonStatesSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
