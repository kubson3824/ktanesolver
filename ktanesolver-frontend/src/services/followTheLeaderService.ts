import { api, withErrorWrapping } from "../lib/api";

export const FOLLOW_THE_LEADER_COLORS = ["RED", "GREEN", "WHITE", "YELLOW", "BLUE", "BLACK"] as const;
export type FollowTheLeaderColor = (typeof FOLLOW_THE_LEADER_COLORS)[number];

export interface FollowTheLeaderOutput {
  startPlug: number;
  cutPlugs: number[];
  direction: "FORWARD" | "REVERSE" | "DESCENDING";
  cutAllDescending: boolean;
}

export async function solveFollowTheLeader(
  roundId: string,
  bombId: string,
  moduleId: string,
  wiresByPlug: (FollowTheLeaderColor | null)[],
): Promise<{ output: FollowTheLeaderOutput }> {
  return withErrorWrapping(async () => {
    const response = await api.post(`/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, {
      input: { wiresByPlug },
    });
    return response.data;
  });
}
