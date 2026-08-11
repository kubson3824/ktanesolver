import { solveModule } from "../lib/api";

export const HORRIBLE_MEMORY_COLORS = ["BLUE", "GREEN", "RED", "ORANGE", "PURPLE", "PINK"] as const;
export type HorribleMemoryColor = typeof HORRIBLE_MEMORY_COLORS[number];
export interface HorribleMemoryButton { label: number; color: HorribleMemoryColor }
export interface HorribleMemoryOutput { stage: number; position: number; label: number; color: string }

export const solveHorribleMemory = (roundId: string, bombId: string, moduleId: string, stage: number, display: number, buttons: HorribleMemoryButton[], restartAttempt: boolean): Promise<{ output: HorribleMemoryOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { stage, display, buttons, restartAttempt });
