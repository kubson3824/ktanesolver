import { solveModule } from "../lib/api";

export interface BurglarAlarmInput {
  moduleNumber: string;
}

export interface BurglarAlarmOutput {
  code: string;
}

export const solveBurglarAlarm = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: BurglarAlarmInput,
) => solveModule<BurglarAlarmInput, { output: BurglarAlarmOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
