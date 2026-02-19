import { api, withErrorWrapping } from "../lib/api";

export interface CryptographyInput {
  ciphertext: string;
  keyLetters: string[];
}

export interface CryptographyOutput {
  plaintext: string;
  keyOrder: string[];
}

export interface CryptographySolveRequest {
  input: CryptographyInput;
}

export interface CryptographySolveResponse {
  output: CryptographyOutput;
  solved?: boolean;
}

export const solveCryptography = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  request: CryptographySolveRequest
): Promise<CryptographySolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<CryptographySolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      request
    );
    return response.data;
  });
};
