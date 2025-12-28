import { api, withErrorWrapping } from "../lib/api";

export interface ComplicatedWire {
  red: boolean;
  blue: boolean;
  led: boolean;
  star: boolean;
}

export interface ComplicatedWiresSolveRequest {
  input: {
    wires: ComplicatedWire[];
  };
}

export interface ComplicatedWiresSolveResponse {
  output: {
    cutWires: number[];
  };
  solved: boolean;
}

export const solveComplicatedWires = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: ComplicatedWiresSolveRequest
): Promise<ComplicatedWiresSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<ComplicatedWiresSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
