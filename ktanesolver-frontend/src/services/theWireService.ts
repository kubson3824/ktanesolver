import { api, withErrorWrapping } from "../lib/api";

export type TheWireColor = "BLUE" | "GREEN" | "GREY" | "ORANGE" | "PURPLE" | "RED";

export interface TheWireInput {
  dial1Color: TheWireColor;
  dial2Color: TheWireColor;
  dial3Color: TheWireColor;
  wireColor: TheWireColor;
  displayedNumber: number;
  initiationCount: number;
}

export interface TheWireOutput {
  dial1: string;
  dial2: string;
  dial3: string;
  cutSecond: number;
}

export const solveTheWire = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: TheWireInput,
) => withErrorWrapping(async () => (await api.post<{ output: TheWireOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
)).data);
