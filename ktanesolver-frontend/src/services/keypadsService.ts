import { api, withErrorWrapping } from "../lib/api";

export type KeypadSymbol = 
  | "BALLOON" 
  | "AT" 
  | "LAMBDA" 
  | "LIGHTNING" 
  | "SQUID_KNIFE" 
  | "HOOK_N" 
  | "BACKWARD_C" 
  | "EURO" 
  | "CURSIVE" 
  | "HOLLOW_STAR" 
  | "QUESTION_MARK" 
  | "COPYRIGHT" 
  | "PUMPKIN" 
  | "DOUBLE_K" 
  | "MELTED_3" 
  | "SIX" 
  | "PARAGRAPH" 
  | "BT" 
  | "SMILEY" 
  | "PITCHFORK" 
  | "C" 
  | "DRAGON" 
  | "FILLED_STAR" 
  | "TRACK" 
  | "AE" 
  | "N_WITH_HAT" 
  | "OMEGA";

export interface KeypadsSolveRequest {
  input: {
    symbols: KeypadSymbol[];
  };
}

export interface KeypadsSolveResponse {
  output: {
    pressOrder: KeypadSymbol[];
  };
}

export const solveKeypads = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: KeypadsSolveRequest
): Promise<KeypadsSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<KeypadsSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
