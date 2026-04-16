import { api, withErrorWrapping } from "../lib/api";

export interface CaesarCipherSolveRequest {
  input: {
    ciphertext: string;
  };
}

export interface CaesarCipherSolveResponse {
  output: {
    solution: string;
    offset: number;
  };
}

export const solveCaesarCipher = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  request: CaesarCipherSolveRequest,
): Promise<CaesarCipherSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<CaesarCipherSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      request,
    );
    return response.data;
  });
};
