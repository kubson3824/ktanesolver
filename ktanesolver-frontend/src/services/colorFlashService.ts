import { api, withErrorWrapping } from "../lib/api";

export type ColorFlashColor = "RED" | "YELLOW" | "GREEN" | "BLUE" | "MAGENTA" | "WHITE";

export interface ColorFlashEntry {
  word: ColorFlashColor;
  color: ColorFlashColor;
}

export interface ColorFlashSolveRequest {
  input: {
    sequence: ColorFlashEntry[];
  };
}

export interface ColorFlashSolveResponse {
  output: {
    pressYes: boolean;
    pressNo: boolean;
    instruction: string;
    position: number;
  };
  solved: boolean;
}

export const solveColorFlash = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: ColorFlashSolveRequest
): Promise<ColorFlashSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<ColorFlashSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
