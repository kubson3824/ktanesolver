import { solveModule } from "../lib/api";

export const MAFIA_SUSPECTS = [
  "ROB", "TIM", "MARY", "BRIANE", "HUNTER", "MACY", "JOHN", "WILL", "LACY", "CLAIRE",
  "KENNY", "RICK", "WALTER", "BONNIE", "LUKE", "BILL", "SARAH", "LARRY", "KATE", "STACY",
  "DIANE", "MAC", "JIM", "CLYDE", "TOMMY", "LENNY", "MOLLY", "BENNY", "PHIL", "BOB",
  "GARY", "TED", "KIM", "NATE", "CHER", "RON", "THOMAS", "SAM", "DUKE", "JACK",
  "ED", "RONNY", "TERRY", "CLAIRA", "NICK", "COB", "ASH", "DON", "JERRY", "SIMON",
] as const;

export type MafiaSuspect = typeof MAFIA_SUSPECTS[number];

export interface MafiaInput {
  suspects: MafiaSuspect[];
  startingTimeMinutes: number;
  additionalModuleNames: string[];
  additionalPortCount: number;
  hasTwoFactor: boolean;
  hasColoredIndicator: boolean;
  hasHdmiPort: boolean;
  hasVgaPort: boolean;
  hasAdditionalNeedyModule: boolean;
}

export interface MafiaOutput {
  godfather: MafiaSuspect;
  lastRemaining: MafiaSuspect;
  eliminationOrder: MafiaSuspect[];
}

export const solveMafia = (roundId: string, bombId: string, moduleId: string, input: MafiaInput) =>
  solveModule<MafiaInput, { output: MafiaOutput }>(roundId, bombId, moduleId, input);
