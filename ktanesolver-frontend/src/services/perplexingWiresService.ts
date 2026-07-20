import { api, withErrorWrapping } from "../lib/api";

export const PERPLEXING_WIRE_COLORS = ["RED", "YELLOW", "BLUE", "WHITE", "GREEN", "ORANGE", "PURPLE", "BLACK"] as const;
export const PERPLEXING_ARROW_COLORS = ["RED", "GREEN", "BLUE", "YELLOW", "PURPLE"] as const;
export const PERPLEXING_ARROW_DIRECTIONS = ["UP", "LEFT", "DOWN", "RIGHT"] as const;

export type PerplexingWireColor = (typeof PERPLEXING_WIRE_COLORS)[number];
export type PerplexingArrowColor = (typeof PERPLEXING_ARROW_COLORS)[number];
export type PerplexingArrowDirection = (typeof PERPLEXING_ARROW_DIRECTIONS)[number];
export interface PerplexingWire {
  topConnector: number;
  color: PerplexingWireColor;
  arrowColor: PerplexingArrowColor;
  arrowDirection: PerplexingArrowDirection;
}
export interface PerplexingWiresInput { wires: PerplexingWire[]; filledStars: boolean[]; ledsOn: boolean[] }
export interface PerplexingWiresOutput { cutFirst: number[]; cutNormal: number[]; cutLast: number[] }

export async function solvePerplexingWires(roundId: string, bombId: string, moduleId: string, input: PerplexingWiresInput): Promise<{ output: PerplexingWiresOutput; solved: boolean }> {
  return withErrorWrapping(async () => {
    const response = await api.post(`/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input });
    return response.data;
  });
}
