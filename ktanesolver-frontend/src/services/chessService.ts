import { api, withErrorWrapping } from "../lib/api";

export interface ChessSolveRequest {
  input: {
    coordinates: string[];
  };
}

export interface ChessSolveResponse {
  output?: {
    coordinate: string;
    pieceAssignments?: Record<string, string>;
  };
  solved?: boolean;
  /** Present when the backend returns a failure (still 200 OK). */
  reason?: string;
}

export const solveChess = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  request: ChessSolveRequest
): Promise<ChessSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<ChessSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      request
    );
    return response.data;
  });
};
