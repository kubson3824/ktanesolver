import { api, withErrorWrapping } from "../lib/api";

export type AstrologyElementType = "FIRE" | "WATER" | "EARTH" | "AIR";

export type AstrologyPlanetType =
  | "SUN"
  | "MOON"
  | "MERCURY"
  | "VENUS"
  | "MARS"
  | "JUPITER"
  | "SATURN"
  | "URANUS"
  | "NEPTUNE"
  | "PLUTO";

export type AstrologyZodiacType =
  | "ARIES"
  | "TAURUS"
  | "GEMINI"
  | "CANCER"
  | "LEO"
  | "VIRGO"
  | "LIBRA"
  | "SCORPIO"
  | "SAGITTARIUS"
  | "CAPRICORN"
  | "AQUARIUS"
  | "PISCES";

export interface AstrologyInput {
  element: AstrologyElementType;
  planet: AstrologyPlanetType;
  zodiac: AstrologyZodiacType;
}

export interface AstrologyOutput {
  omenScore: number;
}

export async function solveAstrology(
  roundId: string,
  bombId: string,
  moduleId: string,
  data: { input: AstrologyInput }
) {
  return withErrorWrapping(async () => {
    const response = await api.post<{ output: AstrologyOutput }>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      data
    );
    return response.data;
  });
}
