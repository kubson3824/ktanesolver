import { api, withErrorWrapping } from "../lib/api";

export interface AdventureGameInput {
  enemy: string;
  str: number;
  dex: number;
  intelligence: number;
  heightFeet: number;
  heightInches: number;
  temperatureCelsius: number;
  gravityMs2: number;
  pressureKpa: number;
  weapons: string[];
  miscItems: string[];
  /** When true, stats are after using items (e.g. after Potion); only weapon is computed. */
  itemsAlreadyUsed?: boolean;
  /** When true, Potion was used first; stats are post-Potion. Other items and weapon are reevaluated with these stats. */
  potionUsedFirst?: boolean;
}

export interface AdventureGameOutput {
  itemsToUse: string[];
  weaponToUse: string;
}

export interface AdventureGameSolveRequest {
  input: AdventureGameInput;
}

export interface AdventureGameSolveResponse {
  output: AdventureGameOutput;
  solved?: boolean;
}

export const solveAdventureGame = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  request: AdventureGameSolveRequest
): Promise<AdventureGameSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<AdventureGameSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      request
    );
    return response.data;
  });
};
