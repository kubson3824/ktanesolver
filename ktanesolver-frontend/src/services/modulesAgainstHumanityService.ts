import { api, withErrorWrapping } from "../lib/api";

export interface ModulesAgainstHumanityInput {
  initialBlackText: string;
  initialWhiteText: string;
  blackOnLeft: boolean;
  secondaryBlackPresent: boolean | null;
  secondaryWhitePresent: boolean | null;
}

export interface ModulesAgainstHumanityOutput {
  phase: "SECONDARY" | "FINAL";
  secondaryBlackPosition: number;
  secondaryWhitePosition: number;
  finalBlackPosition: number | null;
  finalWhitePosition: number | null;
}

export const solveModulesAgainstHumanity = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: ModulesAgainstHumanityInput,
) => withErrorWrapping(async () => (await api.post<{ output: ModulesAgainstHumanityOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
)).data);
