import { api, withErrorWrapping } from "../lib/api";

export interface TaxReturnsInput {
  turnovers: number[];
  expenses: number[];
  surnameFirstLetter: string;
  niLastLetter: string;
  payrollLastDigit: number;
}

export interface TaxReturnsOutput {
  grossTurnover: number;
  grossExpenses: number;
  pensionRate: number;
  pensionContribution: number;
  portfolio: string;
  taxFreeInvestment: number;
  grossProfit: number;
  taxFreeAllowance: number;
  incomeTax: number;
  nationalInsurance: number;
  totalTaxBill: number;
}

export const solveTaxReturns = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: TaxReturnsInput,
) => withErrorWrapping(async () => (await api.post<{ output: TaxReturnsOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
  { input },
)).data);
