import { api, withErrorWrapping } from "../lib/api";

export interface SwitchesInput {
  currentSwitches: boolean[];
  ledPositions: boolean[];
}

export interface SwitchesOutput {
  solved: boolean;
  instruction: string;
  solutionSteps: number[];
}

export interface SwitchesSolveRequest {
  input: SwitchesInput;
}

export interface SwitchesSolveResponse {
  output: SwitchesOutput;
}

export const solveSwitches = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: SwitchesSolveRequest
): Promise<SwitchesSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<SwitchesSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
