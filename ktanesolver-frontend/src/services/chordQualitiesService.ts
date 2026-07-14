import { solveModule } from "../lib/api";

export interface ChordQualitiesOutput {
  givenChord: string;
  answerChord: string;
  answerNotes: string[];
}

export const solveChordQualities = (
  roundId: string,
  bombId: string,
  moduleId: string,
  notes: string[],
): Promise<{ output: ChordQualitiesOutput }> =>
  solveModule<{ notes: string[] }, { output: ChordQualitiesOutput }>(roundId, bombId, moduleId, { notes });
