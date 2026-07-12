import { api, withErrorWrapping } from "../lib/api";

export interface EnglishTestInput { sentence: string; questionNumber: number }
export interface EnglishTestOutput { correctAnswer: string; questionNumber: number }

export const solveEnglishTest = async (roundId: string, bombId: string, moduleId: string, input: EnglishTestInput) =>
  withErrorWrapping(async () => (await api.post<{ output: EnglishTestOutput; solved: boolean }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
  )).data);
