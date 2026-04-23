import { api, withErrorWrapping } from "../lib/api";

export interface PerspectivePeg {
  color: string;
  sides: number;
}

export interface PerspectivePegsInput {
  pegs: PerspectivePeg[];
  candidateSequences: string[][];
}

export interface PerspectivePegsOutput {
  keyColor: string;
  currentSequence: string[];
  keySequence: string[];
  viewNumber: number;
  direction: string;
  pressPositions: number[];
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
