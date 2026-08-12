import { api, withErrorWrapping } from "../lib/api";

export const SKINNY_WIRE_COLORS = ["BLACK", "BLUE", "GREEN", "ORANGE", "PINK", "RED", "WHITE", "YELLOW"] as const;
export type SkinnyWireColor = (typeof SKINNY_WIRE_COLORS)[number];
export type SkinnyWireLetterPort = "A" | "B" | "C";
export type SkinnyWireNumberPort = 1 | 2 | 3;

export interface SkinnyWire {
  color: SkinnyWireColor;
  letterPort: SkinnyWireLetterPort;
  numberPort: SkinnyWireNumberPort;
}

export interface SkinnyWiresOutput {
  coordinate: string;
  color: SkinnyWireColor;
  ruleNumber: number;
}

export async function solveSkinnyWires(roundId: string, bombId: string, moduleId: string, wires: SkinnyWire[]) {
  return withErrorWrapping(async () => (await api.post<{ output: SkinnyWiresOutput; solved: boolean }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input: { wires } },
  )).data);
}
