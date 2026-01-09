import { api, withErrorWrapping } from "../lib/api";

export interface CombinationLockInput {
}

export interface CombinationLockOutput {
  solved: boolean;
  instruction: string;
  firstNumber: number;
  secondNumber: number;
  thirdNumber: number;
}

export interface CombinationLockSolveRequest {
  input: CombinationLockInput;
}

export interface CombinationLockSolveResponse {
  output: CombinationLockOutput;
}

export const solveCombinationLock = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: CombinationLockSolveRequest
): Promise<CombinationLockSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<CombinationLockSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
