import { solveModule } from "../lib/api";

export interface SinkInput {
  goldPlatedKnobs: boolean;
  stainlessSteelFaucet: boolean;
  copperDrainPipe: boolean;
  hasHdmiPort: boolean;
}

export interface SinkOutput {
  sequence: Array<"HOT" | "COLD">;
}

export const solveSink = (roundId: string, bombId: string, moduleId: string, input: SinkInput) =>
  solveModule<SinkInput, { output: SinkOutput; solved: boolean }>(roundId, bombId, moduleId, input);
