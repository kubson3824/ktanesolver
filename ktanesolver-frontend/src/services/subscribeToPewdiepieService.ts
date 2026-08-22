import { solveModule } from "../lib/api";

export interface SubscribeToPewdiepieOutput {
  startingPewdiepie: number; startingTSeries: number;
  adjustedPewdiepie: number; adjustedTSeries: number;
  subscriberGap: number; submission: string;
}

export const solveSubscribeToPewdiepie = (
  roundId: string, bombId: string, moduleId: string,
  pewdiepieSubscribers: number, tSeriesSubscribers: number,
): Promise<{ output: SubscribeToPewdiepieOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { pewdiepieSubscribers, tSeriesSubscribers });
