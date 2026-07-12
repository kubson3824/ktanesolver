import { api, withErrorWrapping } from "../lib/api";

export type RpslsSign = "ROCK" | "PAPER" | "SCISSORS" | "LIZARD" | "SPOCK";

export interface RockPaperScissorsLizardSpockOutput {
  targetSign: RpslsSign | null;
  signsToPress: RpslsSign[];
  scoringRule: string;
}

export const solveRockPaperScissorsLizardSpock = async (
  roundId: string, bombId: string, moduleId: string, decoy: RpslsSign | null,
) => withErrorWrapping(async () => (await api.post<{ output: RockPaperScissorsLizardSpockOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input: { decoy } },
)).data);
