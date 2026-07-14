import { api, withErrorWrapping } from "../lib/api";

export interface TextFieldPosition { column: number; row: number }
export interface TextFieldOutput { tableName: string; positions: TextFieldPosition[] }

export const solveTextField = async (roundId: string, bombId: string, moduleId: string, displayedLetter: string) =>
  withErrorWrapping(async () => (await api.post<{ output: TextFieldOutput; solved: boolean }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input: { displayedLetter } },
  )).data);
