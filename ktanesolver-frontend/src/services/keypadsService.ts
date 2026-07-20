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

const KEYPAD_SYMBOL_IMAGE_FILE: Record<KeypadSymbol, string> = {
  BALLOON: "28-balloon.png", AT: "13-at.png", LAMBDA: "30-upsidedowny.png",
  LIGHTNING: "12-squigglyn.png", SQUID_KNIFE: "7-squidknife.png", HOOK_N: "9-hookn.png",
  BACKWARD_C: "23-leftc.png", EURO: "16-euro.png", CURSIVE: "26-cursive.png",
  HOLLOW_STAR: "3-hollowstar.png", QUESTION_MARK: "20-questionmark.png",
  COPYRIGHT: "1-copyright.png", PUMPKIN: "8-pumpkin.png", DOUBLE_K: "5-doublek.png",
  MELTED_3: "15-meltedthree.png", SIX: "11-six.png", PARAGRAPH: "21-paragraph.png",
  BT: "31-bt.png", SMILEY: "4-smileyface.png", PITCHFORK: "24-pitchfork.png",
  C: "22-rightc.png", DRAGON: "19-dragon.png", FILLED_STAR: "2-filledstar.png",
  TRACK: "27-tracks.png", AE: "14-ae.png", N_WITH_HAT: "18-nwithhat.png", OMEGA: "6-omega.png",
};

// ponytail: hotlinks the official manual repo; vendor the PNGs locally if offline use matters
export const keypadSymbolImageUrl = (symbol: KeypadSymbol) =>
  `https://ktane.timwi.de/HTML/img/Keypad/${KEYPAD_SYMBOL_IMAGE_FILE[symbol]}`;

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
