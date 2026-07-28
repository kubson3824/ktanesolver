import { solveModule } from "../lib/api";

export interface CookingOutput {
  meal: string;
  temperatureC: number;
  ovenSetting:
    | "BOTTOM_ELEMENT_HEAT"
    | "BOTTOM_ELEMENT_HEAT_WITH_GRILL"
    | "CONVENTIONAL_HEATING"
    | "FAN_OVEN"
    | "GRILL"
    | "FAN_WITH_GRILL";
  lightOn: boolean;
  person: string;
  timeMinutes: number;
}

export const solveCooking = (roundId: string, bombId: string, moduleId: string) =>
  solveModule<Record<string, never>, { output: CookingOutput; solved: boolean }>(
    roundId,
    bombId,
    moduleId,
    {},
  );
