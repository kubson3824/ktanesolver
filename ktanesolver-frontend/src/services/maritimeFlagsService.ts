import { solveModule } from "../lib/api";

export interface MaritimeFlagsInput { callsign: string; signalledBearing: number }
export interface MaritimeFlagsOutput { callsignBearing: number; finalBearing: number; direction: string }

export const solveMaritimeFlags = (
  roundId: string, bombId: string, moduleId: string, input: MaritimeFlagsInput,
): Promise<{ output: MaritimeFlagsOutput; solved: boolean }> =>
  solveModule<MaritimeFlagsInput, { output: MaritimeFlagsOutput; solved: boolean }>(roundId, bombId, moduleId, input);
