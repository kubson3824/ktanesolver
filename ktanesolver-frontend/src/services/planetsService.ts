import { solveModule } from "../lib/api";

export const PLANET_NAMES = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Other"];
export const PLANET_STRIP_COLORS = ["Aqua", "Blue", "Green", "Lime", "Orange", "Red", "Yellow", "White", "Off"];
export interface PlanetsOutput { numberA: number; numberB: number; numberC: number; numberD: number; code: string }
export const solvePlanets = (roundId: string, bombId: string, moduleId: string, planet: string, stripColors: string[], productFactorOne: number, productFactorTwo: number): Promise<{ output: PlanetsOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { planet, stripColors, productFactorOne, productFactorTwo });
