import { api, withErrorWrapping } from "../lib/api";

export type BulbColor = "BLUE" | "GREEN" | "PURPLE" | "RED" | "WHITE" | "YELLOW";
export interface TheBulbInput {
  color: BulbColor | null;
  opaque: boolean | null;
  lightOn: boolean | null;
  observation: boolean | null;
}
export interface TheBulbOutput { actions: string[]; continueFrom: number; prompt: string | null }

export const solveTheBulb = async (roundId: string, bombId: string, moduleId: string, input: TheBulbInput) =>
  withErrorWrapping(async () => (await api.post<{ output: TheBulbOutput; solved: boolean }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
  )).data);
