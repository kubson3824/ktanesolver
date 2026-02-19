import { api, withErrorWrapping } from "../lib/api";

export interface CrazyTalkInput {
  displayText: string;
}

export interface CrazyTalkOutput {
  downAt: number;
  upAt: number;
}

export interface CrazyTalkSolveRequest {
  input: CrazyTalkInput;
}

export interface CrazyTalkSolveResponse {
  output: CrazyTalkOutput;
  solved?: boolean;
}

export const solveCrazyTalk = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  request: CrazyTalkSolveRequest
): Promise<CrazyTalkSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<CrazyTalkSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      request
    );
    return response.data;
  });
};
