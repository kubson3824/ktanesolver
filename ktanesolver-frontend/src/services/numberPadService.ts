import { api, withErrorWrapping } from "../lib/api";

export type NumberPadColor = "BLUE" | "GREEN" | "RED" | "WHITE" | "YELLOW";

export interface NumberPadInput {
  buttonColors: NumberPadColor[];
}

export interface NumberPadOutput {
  code: string;
  instruction: string;
}

export interface NumberPadSolveRequest {
  input: NumberPadInput;
}

export interface NumberPadSolveResponse {
  output: NumberPadOutput;
}

export const solveNumberPad = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: NumberPadSolveRequest,
): Promise<NumberPadSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<NumberPadSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input,
    );
    return response.data;
  });
};
