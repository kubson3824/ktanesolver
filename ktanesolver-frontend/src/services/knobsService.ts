import { api } from '../lib/api';

export interface KnobRequest {
  indicators: boolean[];
}

export interface KnobResponse {
  position: string;
}

export async function solveKnob(
  roundId: string,
  bombId: string,
  moduleId: string,
  request: KnobRequest
): Promise<KnobResponse> {
  const response = await api.post(`/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, {
    input: request
  });
  
  return response.data.output;
}