import { api, withErrorWrapping } from "../lib/api";

export type HexamazeMarking =
  | "CIRCLE"
  | "TRIANGLE_UP"
  | "TRIANGLE_DOWN"
  | "TRIANGLE_LEFT"
  | "TRIANGLE_RIGHT"
  | "HEXAGON";
export type HexamazeColor = "RED" | "YELLOW" | "GREEN" | "CYAN" | "BLUE" | "PINK";

export interface HexamazeInput {
  markings: Record<string, HexamazeMarking>;
  pawnQ: number;
  pawnR: number;
  pawnColor: HexamazeColor;
}

export interface HexamazeOutput {
  moves: string[];
  mazeCenterQ: number;
  mazeCenterR: number;
  clockwiseRotation: number;
  /** Screen-frame wall segments "q,r,dir" (dir 0-5 = NW,N,NE,SE,S,SW). Absent on solutions stored before walls were added. */
  walls?: string[];
}

export const solveHexamaze = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: HexamazeInput,
): Promise<{ output?: HexamazeOutput; reason?: string }> => withErrorWrapping(async () => {
  const response = await api.post<{ output?: HexamazeOutput; reason?: string }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
    { input },
  );
  return response.data;
});
