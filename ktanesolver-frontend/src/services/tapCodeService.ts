import { api, withErrorWrapping } from "../lib/api";

export interface TapCodeSolveResponse {
  output: {
    solutionWord: string;
    tapCode: string[];
  };
}

export const solveTapCode = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  receivedWord: string,
): Promise<TapCodeSolveResponse> => withErrorWrapping(async () => {
  const response = await api.post<TapCodeSolveResponse>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
    { input: { receivedWord } },
  );
  return response.data;
});
