import { api, withErrorWrapping } from "../lib/api";

export type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export interface TheNumberInput {
  buttons: number[];
  hasTwoFactor: boolean;
  startingTimeMinutes: number;
  startDay: Weekday;
  currentHour: number;
  timerBelowHalf: boolean;
}

export interface TheNumberOutput {
  code: string;
  buttonPositions: number[];
}

export const solveTheNumber = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: TheNumberInput,
) => withErrorWrapping(async () => (await api.post<{ output: TheNumberOutput }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
)).data);
