import { api, withErrorWrapping } from "../lib/api";

export type RoundKeypadSymbol = 
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

export interface RoundKeypadInput {
  symbols: RoundKeypadSymbol[];
}

export interface RoundKeypadOutput {
  symbolsToPress: RoundKeypadSymbol[];
}

export interface RoundKeypadSolveRequest {
  input: RoundKeypadInput;
}

export interface RoundKeypadSolveResponse {
  output: RoundKeypadOutput;
}

export const solveRoundKeypad = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: RoundKeypadSolveRequest
): Promise<RoundKeypadSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<RoundKeypadSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
