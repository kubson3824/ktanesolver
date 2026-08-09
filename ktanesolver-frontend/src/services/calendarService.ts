import { solveModule } from "../lib/api";

export interface CalendarInput {
  activationMonth: number;
  activationDay: number;
  ledColor: string;
  holiday: string;
  leapYear: boolean;
}

export interface CalendarOutput {
  targetMonth: number;
  targetDay: number;
  pressCount: number;
  holiday: string;
}

export const solveCalendar = (roundId: string, bombId: string, moduleId: string, input: CalendarInput) =>
  solveModule<CalendarInput, { output: CalendarOutput; solved: boolean }>(roundId, bombId, moduleId, input);
