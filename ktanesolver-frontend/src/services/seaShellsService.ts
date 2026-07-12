import { api, withErrorWrapping } from "../lib/api";

export interface SeaShellsInput { row: string; column: string; key: string }
export interface SeaShellsOutput { pressOrder: string[]; stage: number }

export const solveSeaShells = async (roundId: string, bombId: string, moduleId: string, input: SeaShellsInput) =>
  withErrorWrapping(async () => (await api.post<{ output: SeaShellsOutput; solved: boolean }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
  )).data);
