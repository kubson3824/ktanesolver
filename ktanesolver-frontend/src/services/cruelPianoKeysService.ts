import { api, withErrorWrapping } from "../lib/api";

export type CruelPianoKeysSymbol =
  | "BREVE"
  | "DOUBLE_SHARP"
  | "DOWN_BOW"
  | "SIXTEENTH_REST"
  | "QUARTER_REST"
  | "SHARP"
  | "T"
  | "U"
  | "B"
  | "C"
  | "C_LOWER"
  | "N"
  | "M"
  | "B_LOWER";

export type CruelPianoKeysNote =
  | "C"
  | "C_SHARP"
  | "D"
  | "D_SHARP"
  | "E"
  | "F"
  | "F_SHARP"
  | "G"
  | "G_SHARP"
  | "A"
  | "A_SHARP"
  | "B";

export interface CruelPianoKeysSolveRequest {
  input: {
    symbols: CruelPianoKeysSymbol[];
    minutesRemaining?: number;
  };
}

export interface CruelPianoKeysSolveResponse {
  output: {
    notes: CruelPianoKeysNote[];
  };
  solved: boolean;
}

export const solveCruelPianoKeys = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: CruelPianoKeysSolveRequest
): Promise<CruelPianoKeysSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<CruelPianoKeysSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
