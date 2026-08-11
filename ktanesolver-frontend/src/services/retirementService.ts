import { solveModule } from "../lib/api";

export interface RetirementHomeScore {
  home: string;
  wifeScore: number;
  childScore: number;
  siblingScore: number;
  total: number;
}

export interface RetirementOutput {
  home: string;
  wife: string;
  child: string;
  sibling: string;
  scores: RetirementHomeScore[];
  tieBreakApplied: boolean;
}

export const solveRetirement = (
  roundId: string, bombId: string, moduleId: string, homes: string[],
): Promise<{ output: RetirementOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { homes });
