import { api, withErrorWrapping } from "../lib/api";

export interface TwoBitsInput {
  stage: number;
  number: number;
}

export interface TwoBitsOutput {
  letters: string;
  /** Completed stages (input number → result letters). Omitted in older backend responses. */
  stages?: { number: number; letters: string }[];
}

export interface TwoBitsSolveRequest {
  input: TwoBitsInput;
}

export interface TwoBitsSolveResponse {
  output: TwoBitsOutput;
  solved: boolean;
}

export const solveTwoBits = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: TwoBitsSolveRequest
): Promise<TwoBitsSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<TwoBitsSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
