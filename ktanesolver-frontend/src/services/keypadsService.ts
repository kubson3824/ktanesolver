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

export const KEYPAD_SYMBOL_DISPLAY: Record<KeypadSymbol, string> = {
  BALLOON: "Ϙ", AT: "Ѧ", LAMBDA: "ƛ", LIGHTNING: "ϟ", SQUID_KNIFE: "Ѭ",
  CURSIVE: "Ҩ", BACKWARD_C: "Ͽ", EURO: "Ӭ", N_WITH_HAT: "Ҋ", HOLLOW_STAR: "☆",
  QUESTION_MARK: "¿", COPYRIGHT: "©", PUMPKIN: "Ѽ", DOUBLE_K: "Җ", MELTED_3: "Ԇ",
  SIX: "б", PARAGRAPH: "¶", BT: "Ѣ", SMILEY: "ټ", PITCHFORK: "Ψ",
  C: "Ͼ", DRAGON: "Ѯ", FILLED_STAR: "★", TRACK: "҂", AE: "æ",
  HOOK_N: "ⳤ", OMEGA: "Ω",
};

export const KEYPAD_SYMBOLS: readonly KeypadSymbol[] = [
  "BALLOON", "AT", "LAMBDA", "LIGHTNING", "SQUID_KNIFE", "HOOK_N", "BACKWARD_C",
  "EURO", "CURSIVE", "HOLLOW_STAR", "QUESTION_MARK", "COPYRIGHT", "PUMPKIN",
  "DOUBLE_K", "MELTED_3", "SIX", "PARAGRAPH", "BT", "SMILEY", "PITCHFORK",
  "C", "DRAGON", "FILLED_STAR", "TRACK", "AE", "N_WITH_HAT", "OMEGA",
] as const;

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
