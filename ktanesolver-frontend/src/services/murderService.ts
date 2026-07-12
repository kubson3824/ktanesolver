import { solveModule } from "../lib/api";

export const MURDER_SUSPECTS = ["MISS_SCARLETT", "PROFESSOR_PLUM", "MRS_PEACOCK", "REVEREND_GREEN", "COLONEL_MUSTARD", "MRS_WHITE"] as const;
export const MURDER_WEAPONS = ["CANDLESTICK", "DAGGER", "LEAD_PIPE", "REVOLVER", "ROPE", "SPANNER"] as const;
export const MURDER_LOCATIONS = ["DINING_ROOM", "STUDY", "KITCHEN", "LOUNGE", "BILLIARD_ROOM", "CONSERVATORY", "BALLROOM", "HALL", "LIBRARY"] as const;

export type MurderSuspect = typeof MURDER_SUSPECTS[number];
export type MurderWeapon = typeof MURDER_WEAPONS[number];
export type MurderLocation = typeof MURDER_LOCATIONS[number];

export interface MurderInput {
  bodyLocation: MurderLocation;
  suspects: MurderSuspect[];
  weapons: MurderWeapon[];
}

export interface MurderOutput {
  suspect: MurderSuspect;
  weapon: MurderWeapon;
  location: MurderLocation;
}

export const solveMurder = (roundId: string, bombId: string, moduleId: string, input: MurderInput) =>
  solveModule<MurderInput, { output: MurderOutput }>(roundId, bombId, moduleId, input);
