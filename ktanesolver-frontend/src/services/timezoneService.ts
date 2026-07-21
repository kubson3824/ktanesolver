import { solveModule } from "../lib/api";

export const TIMEZONE_CITIES = [
  "Alofi",
  "Papeete",
  "Unalaska",
  "Whitehorse",
  "Denver",
  "Managua",
  "Quito",
  "Manaus",
  "Buenos Aires",
  "Sao Paulo",
  "Praia",
  "Edinburgh",
  "Berlin",
  "Bujumbura",
  "Moscow",
  "Tbilisi",
  "Lahore",
  "Omsk",
  "Bangkok",
  "Beijing",
  "Tokyo",
  "Brisbane",
  "Sydney",
  "Tarawa",
] as const;

export type TimezoneCity = typeof TIMEZONE_CITIES[number];
export type TimezonePeriod = "AM" | "PM";

export interface TimezoneInput {
  departureCity: TimezoneCity;
  destinationCity: TimezoneCity;
  hour: number;
  minute: number;
  period: TimezonePeriod;
  twelveHour: boolean;
}

export interface TimezoneOutput {
  submission: string;
}

export const solveTimezone = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: TimezoneInput,
) => solveModule<TimezoneInput, { output: TimezoneOutput; solved: boolean }>(
  roundId,
  bombId,
  moduleId,
  input,
);
