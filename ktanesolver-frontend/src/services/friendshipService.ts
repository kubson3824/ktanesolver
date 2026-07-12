import { api, withErrorWrapping } from "../lib/api";

export interface FriendshipSymbol { name: string; x: number; y: number }
export interface FriendshipInput { symbols: FriendshipSymbol[]; displayedElements: string[] }
export interface FriendshipOutput { element: string; possibleElements: string[] }

export const solveFriendship = async (roundId: string, bombId: string, moduleId: string, input: FriendshipInput) =>
  withErrorWrapping(async () => (await api.post<{ output: FriendshipOutput; solved: boolean }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
  )).data);
