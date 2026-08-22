import { solveModule } from "../lib/api";

export const HIDDEN_COLORS = ["red", "blue", "green", "yellow", "orange", "purple", "magenta", "white"];
export interface HiddenColorsOutput { greenButton: number; correctButton: number; appliedRule: number; namedButtons: Record<string, number> }
export const solveHiddenColors = (roundId: string, bombId: string, moduleId: string, ledColor: string, buttonColors: string[]): Promise<{ output: HiddenColorsOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { ledColor, buttonColors });
