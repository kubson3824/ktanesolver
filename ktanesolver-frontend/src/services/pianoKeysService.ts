import { api, withErrorWrapping } from "../lib/api";

export type PianoKeysSymbol = "FLAT" | "SHARP" | "NATURAL" | "FERMATA" | "C_CLEF" | "MORDENT" | "TURN" | "COMMON_TIME" | "CUT_TIME";

export type PianoKeysNote = "C" | "C_SHARP" | "D" | "D_SHARP" | "E" | "F" | "F_SHARP" | "G" | "G_SHARP" | "A" | "A_SHARP" | "B";

export interface PianoKeysSolveRequest {
  input: {
    symbols: PianoKeysSymbol[];
  };
}

export interface PianoKeysSolveResponse {
  output: {
    notes: PianoKeysNote[];
  };
  solved: boolean;
}

export const solvePianoKeys = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: PianoKeysSolveRequest
): Promise<PianoKeysSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<PianoKeysSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
