import { solveModule } from "../lib/api";

export const GROCERY_ITEMS = ["Apples","Bananas","Bottled Water","Bread","Butter","Candy","Cat Food","Cheese","Coffee","Cookies","Detergent","Eggs","Flour","Glass Cleaner","Hot Sauce","Jelly","Lettuce","Milk","Paper Towels","Peanut Butter","Pepper","Pork","Potatoes","Salt","Sausage","Soda","Soup","Steak","Sugar","Toilet Paper","Tomatoes","Toothpaste","Turkey"];
export interface GroceryStoreOutput { action: "ADD" | "PAY"; item: string; itemPriceCents: number; budgetCents: number; totalBeforeCents: number; totalAfterCents: number; cartItems: string[] }
export const solveGroceryStore = (
  roundId: string, bombId: string, moduleId: string, currentItem: string, resetCart: boolean,
): Promise<{ output: GroceryStoreOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { currentItem, resetCart });
