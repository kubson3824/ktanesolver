import { api, withErrorWrapping } from "../lib/api";

export type GreekCalculusLedColor = "GREEN" | "RED" | "BLUE" | "YELLOW" | "OTHER";

export interface GreekCalculusDataPoint {
  x: number;
  y: string;
}

export interface GreekCalculusInput {
  dataPoints: GreekCalculusDataPoint[];
  blueParameter: string;
  yellowParameter: string;
  ledColor: GreekCalculusLedColor;
}

export interface GreekCalculusOutput {
  answer: number;
}

export const solveGreekCalculus = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: GreekCalculusInput,
) => withErrorWrapping(async () => (await api.post<{ output: GreekCalculusOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
)).data);
