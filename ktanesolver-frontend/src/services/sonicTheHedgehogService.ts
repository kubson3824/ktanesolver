import { solveModule } from "../lib/api";

export const SONIC_MONITORS = [
  { code: "RBt", label: "Running Boots" },
  { code: "In", label: "Invincibility" },
  { code: "EL", label: "Extra Life" },
  { code: "Rg", label: "Rings" },
] as const;

export const SONIC_SOUNDS = [
  "Boss", "Breathe", "Bumper", "Continue", "Drown", "Emerald", "Extra Life", "Final Zone",
  "Invincibility", "Jump", "Lamppost", "Marble Zone", "Skid", "Spikes", "Spin", "Spring",
] as const;

export const SONIC_PICTURES = [
  ["Ballhog", "Burrobot", "Buzz Bomber", "Crab Meat", "Moto Bug"],
  ["Annoyed Sonic", "Dead Sonic", "Drowned Sonic", "Falling Sonic", "Standing Sonic"],
  ["Blue Lamppost", "Red Lamppost", "Red Spring", "Switch", "Yellow Spring"],
] as const;

export type SonicSound = typeof SONIC_SOUNDS[number];
export type SonicPicture = typeof SONIC_PICTURES[number][number];

export interface SonicTheHedgehogInput {
  stage: number;
  sounds: SonicSound[];
  picture: SonicPicture;
}

export interface SonicTheHedgehogOutput {
  stage: number;
  button: "RBt" | "In" | "EL" | "Rg";
  monitor: "Running Boots" | "Invincibility" | "Extra Life" | "Rings";
}

export const solveSonicTheHedgehog = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: SonicTheHedgehogInput,
) => solveModule<SonicTheHedgehogInput, { output: SonicTheHedgehogOutput; solved: boolean }>(
  roundId,
  bombId,
  moduleId,
  input,
);
