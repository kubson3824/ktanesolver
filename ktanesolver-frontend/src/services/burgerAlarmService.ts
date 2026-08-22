import { solveModule } from "../lib/api";

export const BURGER_INGREDIENTS = ["MAYO","BUN","TOMATO","CHEESE","LETTUCE","ONIONS","PICKLES","MUSTARD","KETCHUP","MEAT"] as const;
export type BurgerIngredient = typeof BURGER_INGREDIENTS[number];
export interface BurgerAlarmOutput { tableNumbers: number[]; swapIndexes: number[]; pressSequence: BurgerIngredient[] }
export const solveBurgerAlarm = (
  roundId: string, bombId: string, moduleId: string, buttonIngredients: BurgerIngredient[], displayedCode: string,
  orders: string[], pcmciaPresent: boolean, twoFactorPresent: boolean,
): Promise<{ output: BurgerAlarmOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { buttonIngredients, displayedCode, orders, pcmciaPresent, twoFactorPresent });
