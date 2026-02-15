import { api, withErrorWrapping } from "../lib/api";

export interface ListeningInput {
  soundDescription: string;
}

export interface ListeningOutput {
  code: string;
}

export interface ListeningRequest {
  input: ListeningInput;
}

export interface ListeningResponse {
  output: ListeningOutput;
}

export async function solveListening(
  roundId: string,
  bombId: string,
  moduleId: string,
  data: ListeningRequest
): Promise<ListeningResponse> {
  return withErrorWrapping(async () => {
    const response = await api.post<ListeningResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      data
    );
    return response.data;
  });
}
