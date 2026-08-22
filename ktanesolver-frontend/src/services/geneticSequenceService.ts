import { solveModule } from "../lib/api";

export interface GeneticSequenceOutput {
  buttonOrder: string;
  startingAminoAcid: string;
  aminoAcids: string[];
  pathLabels: string[];
  templateStrand: boolean;
  codingStrand: string;
  finalSequence: string;
  pressPositions: number[];
}

export const solveGeneticSequence = (
  roundId: string, bombId: string, moduleId: string, buttonOrder: string,
): Promise<{ output: GeneticSequenceOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { buttonOrder });
