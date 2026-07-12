import { api, withErrorWrapping } from "../lib/api";

export interface MonsplodeFightInput {
  opponent: string;
  moves: string[];
  minutesRemaining: number | null;
}

export interface MonsplodeFightOutput {
  move: string;
  netDamage: number;
}

export async function solveMonsplodeFight(
  roundId: string,
  bombId: string,
  moduleId: string,
  input: MonsplodeFightInput,
): Promise<{ output: MonsplodeFightOutput }> {
  return withErrorWrapping(async () =>
    (await api.post(`/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input })).data,
  );
}
