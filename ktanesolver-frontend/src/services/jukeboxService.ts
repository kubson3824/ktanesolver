import { solveModule } from "../lib/api";

export interface JukeboxInput {
  lyrics: string[];
}

export interface JukeboxOutput {
  songTitle: string;
  pressPositions: number[];
}

export const solveJukebox = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: JukeboxInput,
): Promise<{ output: JukeboxOutput }> =>
  solveModule<JukeboxInput, { output: JukeboxOutput }>(roundId, bombId, moduleId, input);
