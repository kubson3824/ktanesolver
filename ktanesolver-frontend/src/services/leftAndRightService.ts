import { solveModule } from "../lib/api";

export interface LeftAndRightOutput {
  constructedNumber: string;
  initialBinarySequence: string;
  greenSwitchAfter: number;
  blueSwitchAfter: number;
  pressSequence: string[];
}
export const solveLeftAndRight = (
  roundId: string, bombId: string, moduleId: string, greenButtonSide: string,
): Promise<{ output: LeftAndRightOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { greenButtonSide });
