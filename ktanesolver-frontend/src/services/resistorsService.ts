import { api, withErrorWrapping } from "../lib/api";

export const RESISTOR_DIGIT_COLORS = [
  "BLACK",
  "BROWN",
  "RED",
  "ORANGE",
  "YELLOW",
  "GREEN",
  "BLUE",
  "VIOLET",
  "GRAY",
  "WHITE",
] as const;

export const RESISTOR_MULTIPLIER_COLORS = [
  "BLACK",
  "BROWN",
  "RED",
  "ORANGE",
  "YELLOW",
  "GREEN",
  "BLUE",
  "VIOLET",
  "GOLD",
  "SILVER",
] as const;

export type ResistorsDigitColor = (typeof RESISTOR_DIGIT_COLORS)[number];
export type ResistorsMultiplierColor = (typeof RESISTOR_MULTIPLIER_COLORS)[number];
export type ResistorsColor = ResistorsDigitColor | ResistorsMultiplierColor;
export type ResistorsPin = "A" | "B" | "C" | "D";
export type ResistorsPath = "DIRECT" | "TOP" | "BOTTOM" | "SERIES" | "PARALLEL";

export interface ResistorsBands {
  firstBand: ResistorsDigitColor;
  secondBand: ResistorsDigitColor;
  multiplierBand: ResistorsMultiplierColor;
}

export interface ResistorsConnection {
  inputPin: ResistorsPin;
  outputPin: ResistorsPin;
  path: ResistorsPath;
  resistanceOhms: number;
}

export interface ResistorsOutput {
  primaryInput: ResistorsPin;
  primaryOutput: ResistorsPin;
  secondaryInput: ResistorsPin | null;
  secondaryOutput: ResistorsPin;
  targetResistanceOhms: number;
  topResistanceOhms: number;
  bottomResistanceOhms: number;
  requiredConnections: ResistorsConnection[];
  instruction: string;
}

export interface ResistorsSolveRequest {
  input: {
    topResistor: ResistorsBands;
    bottomResistor: ResistorsBands;
  };
}

export interface ResistorsSolveResponse {
  output: ResistorsOutput;
  solved?: boolean;
}

export async function solveResistors(
  roundId: string,
  bombId: string,
  moduleId: string,
  input: ResistorsSolveRequest,
): Promise<ResistorsSolveResponse> {
  return withErrorWrapping(async () => {
    const response = await api.post<ResistorsSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input,
    );
    return response.data;
  });
}
