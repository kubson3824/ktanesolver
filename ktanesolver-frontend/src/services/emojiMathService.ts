import { api, withErrorWrapping } from "../lib/api";

export interface EmojiMathInput {
  emojiEquation: string;
}

export interface EmojiMathOutput {
  result: number;
  translatedEquation: string;
}

export async function solveEmojiMath(
  roundId: string,
  bombId: string,
  moduleId: string,
  data: { input: EmojiMathInput }
) {
  return withErrorWrapping(async () => {
    const response = await api.post<{ output: EmojiMathOutput }>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      data
    );
    return response.data;
  });
}
