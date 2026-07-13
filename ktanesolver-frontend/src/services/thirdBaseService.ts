import { api, withErrorWrapping } from "../lib/api";
import type {
  WhosOnFirstSolveRequest,
  WhosOnFirstSolveResponse,
} from "./whosOnFirstService";

export type ThirdBaseSolveRequest = WhosOnFirstSolveRequest;
export type ThirdBaseSolveResponse = WhosOnFirstSolveResponse;

export const solveThirdBase = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: ThirdBaseSolveRequest,
): Promise<ThirdBaseSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<ThirdBaseSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input,
    );
    return response.data;
  });
};
