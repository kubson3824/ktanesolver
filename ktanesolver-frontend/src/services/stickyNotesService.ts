import { solveModule } from "../lib/api";

export interface StickyNotesOutput { notePosition: number; task: string; category: string }
export const solveStickyNotes = (roundId: string, bombId: string, moduleId: string, weekday: string, notes: string[]): Promise<{ output: StickyNotesOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { weekday, notes });
