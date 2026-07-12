import { api, withErrorWrapping } from "../lib/api";

export interface PerspectivePeg {
  sideColors: string[];
}

export interface PerspectivePegsInput {
  pegs: PerspectivePeg[];
}

export interface PerspectivePegsOutput {
  keyColor: string;
  currentSequence: string[];
  keySequence: string[];
}

export interface PerspectivePegsSolveRequest {
  input: PerspectivePegsInput;
}

export interface PerspectivePegsSolveResponse {
  output: PerspectivePegsOutput;
  solved?: boolean;
}

export const solvePerspectivePegs = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  request: PerspectivePegsSolveRequest
): Promise<PerspectivePegsSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<PerspectivePegsSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      request
    );
    return response.data;
  });
};
