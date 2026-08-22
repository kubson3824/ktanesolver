import { solveModule } from "../lib/api";

export type StainedGlassColor = "ICE" | "MALACHITE" | "AMBER" | "AMETHYST" | "ROSE" | "AUREOLIN";
export interface StainedGlassInput { paneColors: StainedGlassColor[] }
export interface StainedGlassOutput { smashPositions: string[]; twitchCommand: string }
export const solveStainedGlass = (roundId: string, bombId: string, moduleId: string, input: StainedGlassInput) => solveModule<StainedGlassInput, { output: StainedGlassOutput; solved: boolean }>(roundId, bombId, moduleId, input);
