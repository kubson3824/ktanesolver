import { solveModule } from "../lib/api";

export interface MelodySequencerMove { fromSlot: number; toSlot: number }
export interface MelodySequencerRecording { slot: number; notes: string[] }
export interface MelodySequencerOutput {
  moves: MelodySequencerMove[];
  recordings: MelodySequencerRecording[];
}

export const solveMelodySequencer = (
  roundId: string,
  bombId: string,
  moduleId: string,
  slotParts: Array<number | null>,
): Promise<{ output: MelodySequencerOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { slotParts });
