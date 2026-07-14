import { api, withErrorWrapping } from "../lib/api";

export const WIRE_PLACEMENT_COLORS = ["BLACK", "BLUE", "RED", "WHITE", "YELLOW"] as const;
export type WirePlacementColor = (typeof WIRE_PLACEMENT_COLORS)[number];

export interface WirePlacementWire {
  from: string;
  to: string;
  color: WirePlacementColor;
}

export interface WirePlacementOutput {
  referenceColor: WirePlacementColor;
  cutWires: Array<{ number: number; coordinate: string; color: WirePlacementColor }>;
}

export async function solveWirePlacement(
  roundId: string,
  bombId: string,
  moduleId: string,
  wires: WirePlacementWire[],
): Promise<{ output: WirePlacementOutput }> {
  return withErrorWrapping(async () => {
    const response = await api.post(`/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input: { wires } });
    return response.data;
  });
}
