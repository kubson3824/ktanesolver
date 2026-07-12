import { api, withErrorWrapping } from "../lib/api";

export interface SquareButtonInput {
  color: "BLUE" | "YELLOW" | "DARK_GREY" | "WHITE";
  label: "PURPLE" | "JADE" | "MAROON" | "INDIGO" | "ELEVATE" | "RUN" | "DETONATE" | "";
  ledColor?: "CYAN" | "ORANGE" | "GREEN";
  flickering?: boolean;
}

export interface SquareButtonOutput { hold: boolean; instruction: string }

export const solveSquareButton = async (roundId: string, bombId: string, moduleId: string, input: SquareButtonInput) =>
  withErrorWrapping(async () => (await api.post<{ output: SquareButtonOutput; solved: boolean }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
  )).data);
