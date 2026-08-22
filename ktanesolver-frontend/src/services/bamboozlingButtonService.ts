import { solveModule } from "../lib/api";

export type BamboozlingButtonColor = "WHITE" | "RED" | "ORANGE" | "YELLOW" | "LIME" | "GREEN" | "JADE" | "GREY" | "CYAN" | "AZURE" | "BLUE" | "VIOLET" | "MAGENTA" | "ROSE" | "BLACK";
export type BamboozlingQuoteStyle = "NONE" | "SINGLE" | "DOUBLE";
export interface BamboozlingButtonInput { buttonColor: BamboozlingButtonColor; firstDisplay: string; commaAfterFirst: boolean; thirdDisplay: string; fourthDisplay: string; fourthDisplayColor: BamboozlingButtonColor; fifthDisplay: string; fifthDisplayColor: BamboozlingButtonColor; topLabel: string; bottomLabel: string; quoteStyle: BamboozlingQuoteStyle }
export interface BamboozlingButtonOutput { stage: number; timing: "LAST_DIGIT" | "LAST_TWO_DIGIT_SUM"; firstValue: number; secondValue: number; doubleTap: boolean; instruction: string; twitchCommands: string[]; nextStage: number }
export const solveBamboozlingButton = (roundId: string, bombId: string, moduleId: string, input: BamboozlingButtonInput) => solveModule<BamboozlingButtonInput, { output: BamboozlingButtonOutput; solved: boolean }>(roundId, bombId, moduleId, input);
