import { api, withErrorWrapping } from "../lib/api";

export type CreationWeather = "CLEAR" | "HEAT_WAVE" | "METEOR_SHOWER" | "RAIN" | "WINDY";
export type CreationElement =
  | "WATER" | "AIR" | "EARTH" | "FIRE"
  | "SWAMP" | "ENERGY" | "LIFE" | "PLASMA" | "BACTERIA" | "EGG" | "GHOST" | "WEEDS"
  | "BIRD" | "DINOSAUR" | "LIZARD" | "TURTLE" | "MUSHROOM" | "WORM" | "PLANKTON" | "SEEDS";

export interface CreationInput { weather: CreationWeather; baseElements: CreationElement[] | null; reset: boolean }
export interface CreationOutput {
  day: number;
  totalSteps: number;
  target: CreationElement;
  first: CreationElement;
  second: CreationElement;
  creates: CreationElement;
}

export const solveCreation = async (roundId: string, bombId: string, moduleId: string, input: CreationInput) =>
  withErrorWrapping(async () => (await api.post<{ output: CreationOutput; solved: boolean }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
  )).data);
