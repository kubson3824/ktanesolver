import { api, withErrorWrapping } from "../lib/api";

export interface TurnTheKeySolveRequest {
  input: {
    displayTimeSeconds: number;
  };
}

export interface TurnTheKeySolveResponse {
  output: {
    turnWhenSeconds: number;
    instruction: string;
  };
}

export const solveTurnTheKey = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: TurnTheKeySolveRequest["input"]
): Promise<TurnTheKeySolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<TurnTheKeySolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      { input }
    );
    return response.data;
  });
};
