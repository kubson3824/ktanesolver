import { solveModule } from "../lib/api";

export const SKYRIM_OPTIONS = {
  races: ["Nord", "Khajiit", "Breton", "Argonian", "Dunmer", "Altmer", "Redguard", "Orc", "Imperial"],
  weapons: ["Axe of Whiterun", "Blade of Woe", "Bow of the Hunt", "Chillrend", "Dawnbreaker", "Firiniel's End", "Mace of Molag Bal", "Volendrung", "Windshear"],
  enemies: ["Alduin", "Blood Dragon", "Cave Bear", "Dragon Priest", "Draugr", "Draugr Overlord", "Frost Troll", "Frostbite Spider", "Mudcrab"],
  cities: ["Dawnstar", "Ivarstead", "Markarth", "Riverwood", "Rorikstead", "Solitude", "Whiterun", "Windhelm", "Winterhold"],
  dragonShouts: ["Unrelenting Force", "Disarm", "Ice Form", "Whirlwind Sprint", "Dragonrend", "Dismay", "Fire Breath", "Kyne's Peace", "Slow Time"],
} as const;

export type SkyrimCategory = keyof typeof SKYRIM_OPTIONS;
export interface SkyrimInput { races: string[]; weapons: string[]; enemies: string[]; cities: string[]; dragonShouts: string[] }
export interface SkyrimOutput { race: string; weapon: string; enemy: string; city: string; dragonShout: string }

export const solveSkyrim = (roundId: string, bombId: string, moduleId: string, input: SkyrimInput) =>
  solveModule<SkyrimInput, { output: SkyrimOutput }>(roundId, bombId, moduleId, input);
