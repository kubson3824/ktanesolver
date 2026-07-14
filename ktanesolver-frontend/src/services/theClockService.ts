import { api, withErrorWrapping } from "../lib/api";

export type ClockPeriod = "AM" | "PM";
export type ClockNumeralStyle = "NONE" | "ARABIC" | "ROMAN";
export type ClockCasingColor = "SILVER" | "GOLD";
export type ClockHandStyle = "SPADES" | "ARROWS" | "LINES";
export type ClockNumeralColor = "RED" | "GREEN" | "BLUE" | "GOLD" | "BLACK";
export type ClockTextColor = "BLACK" | "WHITE";

export interface TheClockInput {
  hour: number;
  minute: number;
  period: ClockPeriod;
  numeralStyle: ClockNumeralStyle;
  casingColor: ClockCasingColor;
  colorsMatch: boolean;
  handStyle: ClockHandStyle;
  numeralColor: ClockNumeralColor;
  amPmTextColor: ClockTextColor;
  secondsHandPresent: boolean;
}

export interface TheClockOutput {
  addTime: string;
  subtractTime: string;
  offsetHours: number;
  offsetMinutes: number;
}

export const solveTheClock = async (roundId: string, bombId: string, moduleId: string, input: TheClockInput) =>
  withErrorWrapping(async () => (await api.post<{ output: TheClockOutput; solved: boolean }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
  )).data);
