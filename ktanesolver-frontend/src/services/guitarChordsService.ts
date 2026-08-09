import { solveModule } from "../lib/api";

export interface GuitarChordsOutput {
  stage: number;
  chord: string;
  capoPosition: number;
  frets: string[];
}

export const solveGuitarChords = (roundId: string, bombId: string, moduleId: string, chord: string) =>
  solveModule<{ chord: string }, { output: GuitarChordsOutput; solved: boolean }>(
    roundId, bombId, moduleId, { chord },
  );
