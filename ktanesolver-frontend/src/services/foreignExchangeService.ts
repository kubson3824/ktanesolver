import { api, withErrorWrapping } from "../lib/api";

export interface ForeignExchangeInput {
  baseCurrency: string;
  targetCurrency: string;
  amount: string;
  hasGreenLights: boolean;
}

export interface ForeignExchangeOutput {
  keyPosition: number;
}

export interface ForeignExchangeRequest {
  input: ForeignExchangeInput;
}

export interface ForeignExchangeResponse {
  output: ForeignExchangeOutput;
}

export async function solveForeignExchange(
  roundId: string,
  bombId: string,
  moduleId: string,
  data: ForeignExchangeRequest
): Promise<ForeignExchangeResponse> {
  return withErrorWrapping(async () => {
    const response = await api.post<ForeignExchangeResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      data
    );
    return response.data;
  });
}
