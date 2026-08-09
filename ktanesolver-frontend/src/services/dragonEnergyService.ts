import { solveModule } from "../lib/api";

export const DRAGON_ENERGY_WORDS = ["Angry", "Blessing", "Child", "Curse", "Heaven", "Happiness", "Dragon", "Dream", "Energy", "Female", "Force", "Forest", "Friend", "Hate", "Hope", "Kindness", "Longevity", "Love", "Loyal", "Spirit", "Male", "Mountain", "Night", "Pure", "Heart", "River", "Emotion", "Soul", "Urgency", "Wind"] as const;
export interface DragonEnergyInput { displayedWords: string[]; indicatorColor: string }
export interface DragonEnergyOutput { acceptableWords: string[]; safeTimerDigits: number[]; swapScenario: number }
export const solveDragonEnergy = (
  roundId: string, bombId: string, moduleId: string, input: DragonEnergyInput,
): Promise<{ output: DragonEnergyOutput; solved: boolean }> =>
  solveModule<DragonEnergyInput, { output: DragonEnergyOutput; solved: boolean }>(roundId, bombId, moduleId, input);
