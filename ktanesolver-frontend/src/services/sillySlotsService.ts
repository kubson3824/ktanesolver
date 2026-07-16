import { solveModule } from "../lib/api";

export type Keyword =
  | "SASSY"
  | "SILLY"
  | "SOGGY"
  | "SALLY"
  | "SIMON"
  | "SAUSAGE"
  | "STEVEN";

export type SlotColor = "RED" | "GREEN" | "BLUE";
export type SlotShape = "BOMB" | "GRAPE" | "CHERRY" | "COIN";

export interface Slot {
  color: SlotColor;
  shape: SlotShape;
}

export interface SillySlotsInput {
  keyword: Keyword;
  slots: [Slot, Slot, Slot];
}

export interface SillySlotsSolveResponse {
  output?: {
    legal: boolean;
    illegalRuleNumber?: number;
  };
  solved?: boolean;
  reason?: string;
}

export const solveSillySlots = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: SillySlotsInput,
): Promise<SillySlotsSolveResponse> =>
  solveModule<SillySlotsInput, SillySlotsSolveResponse>(roundId, bombId, moduleId, input);
