import { api, withErrorWrapping } from "../lib/api";

export type WireColor = "RED" | "BLUE" | "BLACK";

export interface WireSequenceCombo {
  color: WireColor;
  letter: "A" | "B" | "C";
}

export interface WireSequencesSolveRequest {
  input: {
    wires: WireSequenceCombo[];
    stage: number;
  };
}

export interface WireSequencesSolveResponse {
  output: {
    cut: boolean[];
  };
  solved: boolean;
}

export const solveWireSequences = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: WireSequencesSolveRequest
): Promise<WireSequencesSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<WireSequencesSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
