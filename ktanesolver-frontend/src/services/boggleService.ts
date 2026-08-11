import { solveModule } from "../lib/api";

export interface BoggleVisibleCell { cell: string; letter: string }
export interface BogglePlay { word: string; cells: string[]; score: number }
export interface BoggleOutput { board: string[]; plays: BogglePlay[]; score: number }

export const solveBoggle = (
  roundId: string,
  bombId: string,
  moduleId: string,
  visible: BoggleVisibleCell[],
): Promise<{ output: BoggleOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { visible });
