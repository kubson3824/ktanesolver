import { api } from '../lib/api';

export interface MorseInput {
  word: string;
}

export interface MorseCandidate {
  word: string;
  frequency: number;
  confidence: number;
}

export interface MorseOutput {
  candidates: MorseCandidate[];
  resolved: boolean;
}

export async function solveMorse(
  roundId: string,
  bombId: string,
  moduleId: string,
  data: { input: MorseInput }
): Promise<{ output: MorseOutput }> {
  const response = await api.post(`/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, data);
  return response.data;
}
