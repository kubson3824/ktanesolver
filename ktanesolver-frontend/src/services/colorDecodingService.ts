import { api, withErrorWrapping } from "../lib/api";

export type ColorDecodingColor = "RED" | "GREEN" | "BLUE" | "YELLOW" | "PURPLE";
export type ColorDecodingPattern = "CHECKERED" | "VERTICAL" | "HORIZONTAL" | "SOLID";
export type ColorDecodingSelection = { type: "ROW" | "COLUMN"; index: number };

export interface ColorDecodingOutput {
  selections: ColorDecodingSelection[];
  constraintSet: number;
}

export interface ColorDecodingInput {
  stage: number;
  pattern: ColorDecodingPattern;
  indicatorColors: ColorDecodingColor[];
  display: ColorDecodingColor[];
}

export const solveColorDecoding = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: ColorDecodingInput,
): Promise<{ output: ColorDecodingOutput; solved: boolean }> =>
  withErrorWrapping(async () => {
    const response = await api.post(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      { input },
    );
    return response.data;
  });
