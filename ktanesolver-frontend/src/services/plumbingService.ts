import { api, withErrorWrapping } from "../lib/api";

export interface PlumbingInput {
  // No user input; solver uses bomb state only.
}

export interface PlumbingOutput {
  activeInputs: boolean[];
  activeOutputs: boolean[];
}

export interface PlumbingSolveRequest {
  input: PlumbingInput;
}

export interface PlumbingSolveResponse {
  output: PlumbingOutput;
  solved?: boolean;
}

export const solvePlumbing = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: PlumbingSolveRequest
): Promise<PlumbingSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<PlumbingSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
