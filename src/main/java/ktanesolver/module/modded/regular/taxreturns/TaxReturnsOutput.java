package ktanesolver.module.modded.regular.taxreturns;

import ktanesolver.logic.ModuleOutput;

public record TaxReturnsOutput(
	long grossTurnover,
	long grossExpenses,
	int pensionRate,
	long pensionContribution,
	String portfolio,
	long taxFreeInvestment,
	long grossProfit,
	long taxFreeAllowance,
	long incomeTax,
	long nationalInsurance,
	long totalTaxBill
) implements ModuleOutput {}
