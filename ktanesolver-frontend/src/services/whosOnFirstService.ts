import { api, withErrorWrapping } from "../lib/api";

export type ButtonPosition = "TOP_LEFT" | "TOP_RIGHT" | "MIDDLE_LEFT" | "MIDDLE_RIGHT" | "BOTTOM_LEFT" | "BOTTOM_RIGHT";

export interface WhosOnFirstSolveRequest {
  input: {
    displayWord: string;
    buttons: Record<ButtonPosition, string>;
  };
}

export interface WhosOnFirstSolveResponse {
  output: {
    position: ButtonPosition;
    buttonText: string;
  };
  solved: boolean;
}

export const solveWhosOnFirst = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: WhosOnFirstSolveRequest
): Promise<WhosOnFirstSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<WhosOnFirstSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
