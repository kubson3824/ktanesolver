import { solveModule } from "../lib/api";

export const IDENTITY_PARADE_HAIR_COLORS = ["BLACK", "BLONDE", "BROWN", "GREY", "RED", "WHITE"] as const;
export const IDENTITY_PARADE_BUILDS = ["FAT", "HUNCHED", "MUSCULAR", "SHORT", "SLIM", "TALL"] as const;
export const IDENTITY_PARADE_ATTIRES = ["BLAZER", "HOODIE", "JUMPER", "SUIT", "T_SHIRT", "TANK_TOP"] as const;
export const IDENTITY_PARADE_SUSPECTS = [
  "ANDY", "BEN", "CHRISSIE", "DYLAN", "EDDIE", "FIONA", "GEMMA", "HARRIET", "IAN",
  "JAMES", "KAYLEIGH", "LOUISE", "MEGAN", "NATE", "OSCAR", "PENNY", "QUENTIN", "RHIANNON",
] as const;

export type IdentityParadeHairColor = typeof IDENTITY_PARADE_HAIR_COLORS[number];
export type IdentityParadeBuild = typeof IDENTITY_PARADE_BUILDS[number];
export type IdentityParadeAttire = typeof IDENTITY_PARADE_ATTIRES[number];
export type IdentityParadeSuspect = typeof IDENTITY_PARADE_SUSPECTS[number];

export interface IdentityParadeInput {
  hairColors: IdentityParadeHairColor[];
  builds: IdentityParadeBuild[];
  attires: IdentityParadeAttire[];
  suspects: IdentityParadeSuspect[];
}

export interface IdentityParadeOutput {
  suspect: IdentityParadeSuspect;
  hairColor: IdentityParadeHairColor;
  build: IdentityParadeBuild;
  attire: IdentityParadeAttire;
}

export const solveIdentityParade = (roundId: string, bombId: string, moduleId: string, input: IdentityParadeInput) =>
  solveModule<IdentityParadeInput, { output: IdentityParadeOutput }>(roundId, bombId, moduleId, input);
