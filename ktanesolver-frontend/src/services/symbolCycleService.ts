import { solveModule } from "../lib/api";

export type SymbolCycleMode = "RETROTRANSPHASIC" | "ANTERODIAMETRIC";
export type SymbolCycleScreen = "LEFT" | "RIGHT";

export interface SymbolCycleInput {
  mode: SymbolCycleMode;
  referenceCycle: number;
  leftCycle: string[];
  rightCycle: string[];
  displayedCycle: number;
  leftSelectable?: string[];
  rightSelectable?: string[];
  leftSymbol?: string;
  rightSymbol?: string;
  incrementScreen?: SymbolCycleScreen;
}

export interface SymbolCycleOutput {
  mode: SymbolCycleMode;
  leftSymbol: string;
  rightSymbol: string;
  targetCycle: number | null;
  clickScreen: SymbolCycleScreen | null;
  clicks: number | null;
  leftClicks: number | null;
  rightClicks: number | null;
}

export const solveSymbolCycle = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: SymbolCycleInput,
): Promise<{ output: SymbolCycleOutput }> =>
  solveModule<SymbolCycleInput, { output: SymbolCycleOutput }>(roundId, bombId, moduleId, input);
