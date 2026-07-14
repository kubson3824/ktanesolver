import { api, withErrorWrapping } from "../lib/api";

export interface BattleshipInput {
  rowCounts: number[];
  columnCounts: number[];
  shipCounts: number[];
  radarShips: string[] | null;
}

export interface BattleshipOutput {
  safeLocations: string[];
  shipLocations: string[];
}

export const solveBattleship = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: BattleshipInput,
) => withErrorWrapping(async () => (await api.post<{ output: BattleshipOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
)).data);
