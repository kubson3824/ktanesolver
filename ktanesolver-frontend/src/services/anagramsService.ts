import { SolveRequest, SolveResponse } from "./api";

export interface AnagramsInput {
  displayWord: string;
}

export interface AnagramsOutput {
  possibleSolutions: string[];
}

export async function solveAnagrams(
  roundId: string,
  bombId: string,
  moduleId: string,
  data: SolveRequest<AnagramsInput>
): Promise<SolveResponse<AnagramsOutput>> {
  const response = await fetch(`/api/round/${roundId}/bomb/${bombId}/module/${moduleId}/solve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to solve anagrams module");
  }

  return response.json();
}
