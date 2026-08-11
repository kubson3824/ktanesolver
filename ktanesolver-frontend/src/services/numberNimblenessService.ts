import { solveModule } from "../lib/api";

export interface NumberNimblenessOutput {
  press: number;
  usedSequenceIndex: number;
  nextSequenceIndex: number;
  remainingAfterPress: number;
  rule: string;
}

export const solveNumberNimbleness = (
  roundId: string,
  bombId: string,
  moduleId: string,
  stage: number,
  miniGame: string,
  display: number,
  availableDigits: number[],
  sequenceIndex: number,
): Promise<{ output: NumberNimblenessOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { stage, miniGame, display, availableDigits, sequenceIndex });
