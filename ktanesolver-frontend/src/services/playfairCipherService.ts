import { solveModule } from "../lib/api";

export interface PlayfairCipherInput {
  encryptedMessage: string;
  screenColor: "MAGENTA" | "BLUE" | "ORANGE" | "YELLOW";
  dayOfWeek: string;
}

export interface PlayfairCipherOutput {
  decryptedMessage: string;
  pressSequence: string;
  key: string;
  encryptedMessage: string;
  screenColor: string;
}

export const solvePlayfairCipher = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: PlayfairCipherInput,
) => solveModule<PlayfairCipherInput, { output: PlayfairCipherOutput; solved: boolean }>(
  roundId,
  bombId,
  moduleId,
  input,
);
