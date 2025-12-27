import { api, withErrorWrapping } from "../lib/api";

export type SimonColor = "RED" | "BLUE" | "GREEN" | "YELLOW";

export interface SimonSolveRequest {
  input: {
    flashes: SimonColor[];
  };
}

export interface SimonSolveResponse {
  output: {
    presses: SimonColor[];
  };
  solved: boolean;
}

export const solveSimon = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: SimonSolveRequest
): Promise<SimonSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<SimonSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
