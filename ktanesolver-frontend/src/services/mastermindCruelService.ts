import { api, withErrorWrapping } from "../lib/api";

export interface MastermindCruelAttempt {
  guess: string[];
  leftColor: string;
  leftNumber: number;
  rightColor: string;
  rightNumber: number;
  solvedModules: number;
  strikes: number;
}

export interface MastermindCruelInput {
  attempts: MastermindCruelAttempt[];
}

export interface MastermindCruelOutput {
  nextGuess: string[];
  remainingCandidates: number;
  submit: boolean;
}

export const solveMastermindCruel = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: MastermindCruelInput,
) => withErrorWrapping(async () => (await api.post<{ output: MastermindCruelOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
)).data);
