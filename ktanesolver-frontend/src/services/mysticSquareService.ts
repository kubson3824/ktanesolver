import { api, withErrorWrapping } from "../lib/api";

export interface MysticSquareInput {
  grid: (number | null)[];
}

export interface MysticSquareOutput {
  skullPosition: number;
  targetConstellation: (number | null)[];
}

export interface MysticSquareSolveRequest {
  input: MysticSquareInput;
}

export interface MysticSquareSolveResponse {
  output: MysticSquareOutput;
  solved?: boolean;
}

export const solveMysticSquare = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  request: MysticSquareSolveRequest
): Promise<MysticSquareSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<MysticSquareSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      request
    );
    return response.data;
  });
};
