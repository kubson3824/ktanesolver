import { api, withErrorWrapping } from "../lib/api";

export interface MathInput {
  equation: string;
}

export interface MathOutput {
  result: number;
}

export async function solveMath(
  roundId: string,
  bombId: string,
  moduleId: string,
  data: { input: MathInput }
) {
  return withErrorWrapping(async () => {
    const response = await api.post<{ output: MathOutput }>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      data
    );
    return response.data;
  });
}
