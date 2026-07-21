import { api, withErrorWrapping } from "../lib/api";

export type FestivePianoKeysSymbol =
  | "MORDENT"
  | "DOWN_BOW"
  | "SIXTEENTH_REST"
  | "BREVE"
  | "C_CLEF"
  | "CAESURA"
  | "DAL_SEGNO"
  | "SIXTEENTH_NOTE"
  | "PEDAL_UP"
  | "UP_BOW"
  | "MARCATO"
  | "SEMIBREVE_NOTE"
  | "ACCENT";

export type FestivePianoKeysNote =
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

export interface FestivePianoKeysSolveResponse {
  output: { notes: FestivePianoKeysNote[] };
  solved: boolean;
}

export const solveFestivePianoKeys = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  symbols: FestivePianoKeysSymbol[],
): Promise<FestivePianoKeysSolveResponse> =>
  withErrorWrapping(async () => {
    const response = await api.post<FestivePianoKeysSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      { input: { symbols } },
    );
    return response.data;
  });
