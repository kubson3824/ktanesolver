import { api, withErrorWrapping } from "../lib/api";

export interface TurnTheKeysSolveRequest {
  input: {
    priority: number;
    rightKeyTurned?: boolean;
    leftKeyTurned?: boolean;
  };
}

export interface TurnTheKeysSolveResponse {
  output: {
    leftKeyInstruction: string;
    rightKeyInstruction: string;
    priority: number;
    canTurnRightKey: boolean;
    canTurnLeftKey: boolean;
    rightKeyTurned?: boolean;
    leftKeyTurned?: boolean;
  };
}

export const solveTurnTheKeys = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: TurnTheKeysSolveRequest["input"]
): Promise<TurnTheKeysSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<TurnTheKeysSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      { input }
    );
    return response.data;
  });
};
