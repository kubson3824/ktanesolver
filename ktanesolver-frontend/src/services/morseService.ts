import { api, withErrorWrapping } from '../lib/api';

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
  return withErrorWrapping(async () => {
    const response = await api.post(`/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, data);
    const body = response.data as { output?: MorseOutput; solved?: boolean } | MorseOutput;
    // Backend returns SolveResult { output, solved }; accept that or raw output
    const output =
      body && typeof body === "object" && "output" in body && body.output != null
        ? body.output
        : Array.isArray((body as MorseOutput).candidates)
          ? (body as MorseOutput)
          : null;
    if (!output || !Array.isArray(output.candidates)) {
      throw new Error("Invalid response from server");
    }
    return { output };
  });
}
