import { api, withErrorWrapping } from "../lib/api";

export interface MemorySolveRequest {
  input: {
    stage: number;
    display: number;
    labels: number[];
  };
}

export interface MemorySolveResponse {
  output: {
    position: number;
    label: number;
  };
  solved: boolean;
}

export const solveMemory = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: MemorySolveRequest
): Promise<MemorySolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<MemorySolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
