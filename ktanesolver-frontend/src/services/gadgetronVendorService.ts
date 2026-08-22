import { solveModule } from "../lib/api";

export interface GadgetronVendorOutput {
  ammoUnitPrice: number;
  refillCost: number;
  boltsAfterRefill: number;
  canBuyWeapon: boolean;
  weaponPrice: number;
  answer: number;
}

export const solveGadgetronVendor = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: { bolts: number; currentWeapon: string; currentAmmo: number; maximumAmmo: number; weaponForSale: string; pdaLit: boolean },
): Promise<{ output: GadgetronVendorOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, input);
