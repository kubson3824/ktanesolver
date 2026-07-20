import { api, withErrorWrapping } from "../lib/api";

export interface MonsplodeTradingCard {
  name: string;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "ULTRA_RARE";
  printVersion: string;
  foil: boolean;
  bentCorners: number;
}

export interface MonsplodeTradingCardsInput {
  hand: MonsplodeTradingCard[];
  offer: MonsplodeTradingCard;
  selectedCard: number;
}

export interface MonsplodeTradingCardsOutput {
  action: "KEEP" | "TRADE";
  tradeCard: number | null;
  selectedCard: number;
  handValues: number[];
  offerValue: number;
  stage: number;
}

export const solveMonsplodeTradingCards = async (
  roundId: string, bombId: string, moduleId: string, input: MonsplodeTradingCardsInput,
) => withErrorWrapping(async () => (await api.post<{ output: MonsplodeTradingCardsOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
)).data);
