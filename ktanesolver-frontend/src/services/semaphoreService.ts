import { api } from '../lib/api';

export interface FlagAngles {
  leftFlagAngle: number;
  rightFlagAngle: number;
}

export interface SemaphoreInput {
  sequence: FlagAngles[];
}

export interface SemaphoreOutput {
  missingCharacter: string;
  resolved: boolean;
}

export async function solveSemaphore(
  roundId: string,
  bombId: string,
  moduleId: string,
  data: { input: SemaphoreInput }
): Promise<{ output: SemaphoreOutput }> {
  const response = await api.post(`/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, data);
  return response.data;
}
