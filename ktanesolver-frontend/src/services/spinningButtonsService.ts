import { api, withErrorWrapping } from "../lib/api";

export interface SpinningButtonInput {
  color: string;
  character: string;
}

export interface SpinningButtonResult extends SpinningButtonInput {
  position: number;
  value: number;
}

export interface SpinningButtonsOutput {
  pressOrder: SpinningButtonResult[];
}

export const solveSpinningButtons = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  buttons: SpinningButtonInput[],
) => withErrorWrapping(async () => (await api.post<{ output: SpinningButtonsOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input: { buttons } },
)).data);
