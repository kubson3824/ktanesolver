import { SolveRequest, SolveResponse } from "./api";

export interface WordScrambleInput {
  letters: string;
}

export interface WordScrambleOutput {
  solved: boolean;
  instruction: string;
  solution: string;
}

export async function solveWordScramble(
  roundId: string,
  bombId: string,
  moduleId: string,
  data: SolveRequest<WordScrambleInput>
): Promise<SolveResponse<WordScrambleOutput>> {
  const response = await fetch(`/api/round/${roundId}/bomb/${bombId}/module/${moduleId}/solve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to solve word scramble module");
  }

  return response.json();
}
