import { solveModule } from "../lib/api";
export interface ShikakuClue { cell: string; shown: string; alternate?: string }
export interface ShikakuOutput { regions: Array<{ clue: string; correctHint: string; cells: string[] }>; presses: string[] }
export const solveShikaku = (roundId: string, bombId: string, moduleId: string, clues: ShikakuClue[]): Promise<{ output: ShikakuOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { clues });
