import { solveModule } from "../lib/api";

export interface MaintenanceInput {
  numberPlate: string;
  numberOfJobs: number;
}

export interface MaintenanceOutput {
  numberPlate: string;
  model: string;
  manufactured: string;
  insuranceCompany: string;
  vennLetter: string;
  carValue: number;
  uncoveredCost: number;
  writeOff: boolean;
  jobs: string[];
  input?: MaintenanceInput;
}

export const solveMaintenance = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: MaintenanceInput,
) => solveModule<MaintenanceInput, { output: MaintenanceOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
