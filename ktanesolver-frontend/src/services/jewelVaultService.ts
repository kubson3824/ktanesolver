import { solveModule } from "../lib/api";

export type Jewel =
  | "AMETHYST" | "EMERALD" | "GLASS" | "ONYX"
  | "POUDRETTEITE" | "RUBY" | "SAPPHIRE" | "SCAPOLITE";

export type GreekLetter =
  | "ALPHA" | "BETA" | "GAMMA" | "DELTA" | "EPSILON" | "ZETA"
  | "ETA" | "THETA" | "IOTA" | "KAPPA" | "LAMBDA" | "MU"
  | "NU" | "XI" | "OMICRON" | "PI" | "RHO" | "SIGMA"
  | "TAU" | "UPSILON" | "PHI" | "CHI" | "PSI" | "OMEGA";

export interface JewelVaultWheel {
  jewelsClockwiseFromNorth: Jewel[];
  firstLetter: GreekLetter;
  secondLetter: GreekLetter;
}

export interface JewelVaultInput {
  wheels: JewelVaultWheel[];
  physicalWheelsByLetter: number[];
}

export interface JewelVaultOutput {
  correctJewels: Jewel[];
  targetOrientation: string;
  actions: string[];
}

export const solveJewelVault = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: JewelVaultInput,
) => solveModule<JewelVaultInput, { output: JewelVaultOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
