import { api, withErrorWrapping } from "../lib/api";

export interface MastermindSimpleAttempt {
  guess: string[];
  exact: number;
  misplaced: number;
}

export interface MastermindSimpleInput {
  attempts: MastermindSimpleAttempt[];
}

export interface MastermindSimpleOutput {
  nextGuess: string[];
  remainingCandidates: number;
  submit: boolean;
}

export const solveMastermindSimple = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: MastermindSimpleInput,
) => withErrorWrapping(async () => (await api.post<{ output: MastermindSimpleOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
)).data);
