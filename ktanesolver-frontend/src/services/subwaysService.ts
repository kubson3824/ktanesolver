import { solveModule } from "../lib/api";

export const SUBWAYS_CITIES = ["NEW_YORK", "LONDON", "PARIS"] as const;
export const SUBWAYS_COMMUTERS = ["BRYAN", "JOHN", "MIKE", "EMILY", "MARY", "KATIE"] as const;
export const SUBWAYS_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;

export type SubwaysCity = typeof SUBWAYS_CITIES[number];
export type SubwaysCommuter = typeof SUBWAYS_COMMUTERS[number];
export type SubwaysDay = typeof SUBWAYS_DAYS[number];

export interface SubwaysInput {
  city: SubwaysCity;
  commuter: SubwaysCommuter;
  day: SubwaysDay;
}

export interface SubwaysOutput {
  route: number;
  time: string;
  stops: string[];
}

export const solveSubways = (roundId: string, bombId: string, moduleId: string, input: SubwaysInput) =>
  solveModule<SubwaysInput, { output: SubwaysOutput }>(roundId, bombId, moduleId, input);
