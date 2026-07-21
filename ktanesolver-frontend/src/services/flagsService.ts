import { solveModule } from "../lib/api";

export const FLAGS_COUNTRIES = [
  "ALGERIA", "AUSTRALIA", "AUSTRIA", "BELGIUM", "BRAZIL", "CANADA", "CHILE", "CHINA", "COLOMBIA",
  "CUBA", "CZECH_REPUBLIC", "DENMARK", "FINLAND", "FRANCE", "GERMANY", "GREENLAND", "ICELAND", "INDIA",
  "JAPAN", "MEXICO", "MOROCCO", "NETHERLANDS", "NEW_ZEALAND", "NORWAY", "PANAMA", "PERU", "POLAND",
  "SAMOA", "SENEGAL", "SOUTH_KOREA", "SPAIN", "SUDAN", "SWEDEN", "THAILAND", "UNITED_KINGDOM", "UNITED_STATES",
] as const;

export type FlagsCountry = typeof FLAGS_COUNTRIES[number];

export interface FlagsInput {
  mainCountry: FlagsCountry;
  countries: FlagsCountry[];
  displayedNumber: number;
}

export interface FlagsOutput {
  answerCountry: FlagsCountry;
  sortedCountries: FlagsCountry[];
  appliedRule: string;
}

export const flagsCountryName = (country: FlagsCountry) => country
  .toLowerCase()
  .split("_")
  .map((word) => word[0].toUpperCase() + word.slice(1))
  .join(" ");

export const solveFlags = (roundId: string, bombId: string, moduleId: string, input: FlagsInput) =>
  solveModule<FlagsInput, { output: FlagsOutput; solved: boolean }>(roundId, bombId, moduleId, input);
