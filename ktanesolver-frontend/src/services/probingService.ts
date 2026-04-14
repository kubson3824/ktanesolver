import { api, withErrorWrapping } from "../lib/api";

export interface ProbingOutput {
  redClipWire: number;
  blueClipWire: number;
  redClipCandidates: number[];
  blueClipCandidates: number[];
  redTargetFrequency: number;
  blueTargetFrequency: number;
  instruction: string;
}

export interface ProbingSolveResponse {
  output: ProbingOutput;
  solved?: boolean;
}

export interface ProbingInput {
  missingFrequenciesByWire: number[];
}

export interface ProbingSolveRequest {
  input: ProbingInput;
}

export const PROBING_FREQUENCIES = [10, 22, 50, 60] as const;
export type ProbingFrequency = (typeof PROBING_FREQUENCIES)[number];

export const solveProbing = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: ProbingSolveRequest,
): Promise<ProbingSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<ProbingSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input,
    );
    return response.data;
  });
};
