import { solveModule } from "../lib/api";

export type PeriodicTableColor = "RED" | "ORANGE" | "YELLOW" | "GREEN" | "BLUE" | "WHITE";
export interface PeriodicTableOutput { atomicNumber: number; elementName: string; symbol: string; elementTerm: number; symbolTerm: number; numberTerm: number; buttonTerm: number; total: number }
export interface PeriodicTableInput { elementName: string; elementColor: PeriodicTableColor; symbol: string; symbolColor: PeriodicTableColor; displayedNumber: number; numberColor: PeriodicTableColor; coloredButtonNumber: number; buttonColor: PeriodicTableColor }

export const solvePeriodicTable = (
  roundId: string, bombId: string, moduleId: string, input: PeriodicTableInput,
): Promise<{ output: PeriodicTableOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, input);
