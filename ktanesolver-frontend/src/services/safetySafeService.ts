import { api, withErrorWrapping } from "../lib/api";

export interface SafetySafeInput {
  // No user input; solver uses bomb state only.
}

export interface SafetySafeOutput {
  dialTurns: number[];
}

export interface SafetySafeSolveRequest {
  input: SafetySafeInput;
}

export interface SafetySafeSolveResponse {
  output: SafetySafeOutput;
  solved?: boolean;
}

export const solveSafetySafe = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: SafetySafeSolveRequest
): Promise<SafetySafeSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<SafetySafeSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
