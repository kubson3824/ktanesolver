import { solveModule } from "../lib/api";

export const STOCK_MARKET_COMPANIES = [
  ["ADM", "Admiral Grp."], ["CNA", "Centrica"], ["GSK", "GlaxoSmithKline"], ["HSB", "HSBC"],
  ["IMB", "Imperial Brands"], ["MKS", "Marks and Spencer"], ["NXT", "Next plc."], ["QLT", "Quilter"],
  ["RMG", "Royal Mail"], ["SVT", "Severn Trent"], ["TUI", "TUI Grp."], ["VOD", "Vodafone Grp."],
] as const;
export const STOCK_MARKET_COLORS = ["BLUE", "RED", "MAGENTA", "GREEN", "YELLOW", "ORANGE", "CYAN", "PURPLE"] as const;
export type StockMarketColor = typeof STOCK_MARKET_COLORS[number];

export interface StockMarketCompanyInput {
  abbreviation: string;
  color: StockMarketColor;
  fluctuations: number[];
}

export interface StockMarketCompanyScore {
  abbreviation: string;
  name: string;
  peakPoints: number;
  slumpPoints: number;
  fluctuationPoints: number;
  total: number;
}

export interface StockMarketOutput {
  companies: string[];
  scores: StockMarketCompanyScore[];
}

export const solveStockMarket = (
  roundId: string, bombId: string, moduleId: string, companies: StockMarketCompanyInput[],
): Promise<{ output: StockMarketOutput; solved: boolean }> =>
  solveModule<{ companies: StockMarketCompanyInput[] }, { output: StockMarketOutput; solved: boolean }>(
    roundId, bombId, moduleId, { companies },
  );
