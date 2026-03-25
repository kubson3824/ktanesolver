import { api, withErrorWrapping } from "../lib/api";

export type Keyword =
  | "SASSY"
  | "BLUE"
  | "RED"
  | "GREEN"
  | "CHERRY"
  | "GRAPE"
  | "BOMB"
  | "COIN";

export type Adjective = "SASSY" | "SILLY" | "SOGGY";
export type Noun = "SALLY" | "SIMON" | "SAUSAGE" | "STEVEN";

export interface Slot {
  adjective: Adjective;
  noun: Noun;
  colour: Keyword;
}

export interface SillySlotsSolveRequest {
  input: {
    keyword: Keyword;
    slots: [Slot, Slot, Slot];
  };
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
  request: SillySlotsSolveRequest
): Promise<SillySlotsSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<SillySlotsSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      request
    );
    return response.data;
  });
};
