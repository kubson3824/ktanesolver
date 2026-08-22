import { solveModule } from "../lib/api";

export interface UnfairCipherAction {
  instruction: string;
  button: string;
  timerSeconds: string[];
}

export interface UnfairCipherOutput {
  keyA: string;
  keyB: string;
  keyC: string;
  caesarOffset: number;
  instructions: string[];
  actions: UnfairCipherAction[];
  instantSolve: boolean;
}

export const solveUnfairCipher = (
  roundId: string,
  bombId: string,
  moduleId: string,
  encryptedMessage: string,
  displayedModuleId: number,
  strikeCount: number,
): Promise<{ output: UnfairCipherOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, {
  encryptedMessage,
  moduleId: displayedModuleId,
  strikeCount,
});
