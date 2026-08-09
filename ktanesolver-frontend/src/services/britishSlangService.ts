import { solveModule } from "../lib/api";

export const BRITISH_SLANG_ENTRIES = [
  ["Bagsy", "Call dibs"], ["Wally", "Silly person"], ["Chinwag", "Having a chat"],
  ["Tickety-boo", "In good order"], ["Waffle", "Speech of little value"], ["Mardy", "Acting sulky"],
  ["Pear-shaped", "Gone wrong"], ["Shirty", "Short-tempered"], ["Shambles", "Total mess"],
  ["Poppycock", "Nonsense"], ["Nick", "Prison"], ["Mint", "Excellent condition"],
  ["Gutted", "Really disappointed"], ["Geezer", "Cool London man"], ["Gaff", "Your home"],
  ["Fag", "Cigarette"], ["Faff", "Waste time"], ["Dench", "“Cool”"],
  ["Chocka", "Packed or busy"], ["Butchers", "Have a look"], ["Budge Up", "Move over"],
  ["Bender", "Long drinking session"], ["Anorak", "Bit of a geek"], ["Blighty", "England/Britain"],
  ["Ta", "Thanks"], ["Cheerio", "Goodbye"], ["Bloke", "Male person"],
  ["Skive", "Skip school or work"], ["Loo", "Toilet"], ["Do", "Party"],
  ["Brolly", "Small parasol"], ["Mortal", "Very drunk"], ["Round", "Drinks for all"],
  ["Lurgy", "Illness"], ["Flog", "Sell quickly"], ["Chuffed", "Really pleased"],
  ["Blinder", "Achieve faultlessly"], ["Mug", "Gullible idiot"], ["Fortnight", "Two weeks"],
  ["Fit", "Very attractive"], ["Quid", "Pound coin"], ["Collywobbles", "Nervous"],
] as const;

export const BRITISH_SLANG_WORDS = BRITISH_SLANG_ENTRIES.map(([word]) => word);
export const BRITISH_SLANG_DEFINITIONS = BRITISH_SLANG_ENTRIES.map(([, definition]) => definition);

export interface BritishSlangInput { definition: string; buttons: string[]; newAttempt: boolean }
export interface BritishSlangOutput { stage: number; pressPosition: number; pressLabel: string; nextStage: number }

export const solveBritishSlang = (
  roundId: string, bombId: string, moduleId: string, input: BritishSlangInput,
): Promise<{ output: BritishSlangOutput; solved: boolean }> =>
  solveModule<BritishSlangInput, { output: BritishSlangOutput; solved: boolean }>(roundId, bombId, moduleId, input);
