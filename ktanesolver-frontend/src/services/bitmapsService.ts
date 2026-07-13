import { api, withErrorWrapping } from "../lib/api";

export interface BitmapsOutput {
  button: number;
  rule: number;
  answer: number;
}

export interface BitmapsInput {
  whiteCounts: number[];
  uniformLineCoordinate: number;
  squareCenterX: number;
}

export const solveBitmaps = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: BitmapsInput,
) => withErrorWrapping(async () => (await api.post<{ output: BitmapsOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
)).data);
