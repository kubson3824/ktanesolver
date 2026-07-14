import { api, withErrorWrapping } from "../lib/api";

export type DoubleOhButton =
  | "SINGLE_VERTICAL"
  | "SINGLE_HORIZONTAL"
  | "DOUBLE_HORIZONTAL"
  | "DOUBLE_VERTICAL"
  | "SQUARE";

export interface DoubleOhInput {
  displayedNumber: number;
  observations: Record<DoubleOhButton, number>;
}

export interface DoubleOhOutput {
  presses: DoubleOhButton[];
}

export const solveDoubleOh = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: DoubleOhInput,
): Promise<{ output: DoubleOhOutput }> => withErrorWrapping(async () => {
  const response = await api.post<{ output: DoubleOhOutput }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
    { input },
  );
  return response.data;
});
