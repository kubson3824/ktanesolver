import { api, withErrorWrapping } from "../lib/api";

export type ShapeEdge = "SQUARE" | "ROUND" | "POINT" | "CONCAVE";
export interface ShapeShiftInput { left: ShapeEdge; right: ShapeEdge }
export type ShapeShiftOutput = ShapeShiftInput;

export const solveShapeShift = async (roundId: string, bombId: string, moduleId: string, input: ShapeShiftInput) =>
  withErrorWrapping(async () => (await api.post<{ output: ShapeShiftOutput }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
  )).data);
