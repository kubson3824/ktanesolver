import { solveModule } from "../lib/api";

export interface XRayInput {
  symbols: string[];
}

export interface XRayOutput {
  button: number;
  destinationRow: number;
  destinationColumn: number;
}

export const solveXRay = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: XRayInput,
) => solveModule<XRayInput, { output: XRayOutput; solved: boolean }>(roundId, bombId, moduleId, input);
