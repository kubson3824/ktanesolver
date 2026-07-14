import { solveModule } from "../lib/api";

export interface CheapCheckoutItemInput {
  name: string;
  weight: number | null;
}

export interface CheapCheckoutInput {
  day: string | null;
  items: CheapCheckoutItemInput[] | null;
  paidAmount: number;
}

export interface CheapCheckoutOutput {
  total: number;
  paidAmount: number;
  change: number;
  needsSecondPayment: boolean;
  instruction: string;
}

export const solveCheapCheckout = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: CheapCheckoutInput,
) => solveModule<CheapCheckoutInput, { output: CheapCheckoutOutput; solved: boolean }>(
  roundId,
  bombId,
  moduleId,
  input,
);
