import { solveModule } from "../lib/api";

export interface DaylightDirectionsInput { activeSun: string; arrowColor: string; currentDirection: string }
export interface DaylightDirectionsOutput { targetDirection: string; turnDirection: string; turnCount: number }

export const solveDaylightDirections = (roundId: string, bombId: string, moduleId: string, input: DaylightDirectionsInput) =>
  solveModule<DaylightDirectionsInput, { output: DaylightDirectionsOutput; solved: boolean }>(roundId, bombId, moduleId, input);
