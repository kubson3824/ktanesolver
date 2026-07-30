package ktanesolver.module.modded.regular.taxreturns;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.TAX_RETURNS,
	id = "taxReturns",
	name = "Tax Returns",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Calculate the income tax and National Insurance due",
	tags = {"tax", "finance", "calculation", "modded"}
)
public class TaxReturnsSolver extends AbstractModuleSolver<TaxReturnsInput, TaxReturnsOutput> {
	private static final long BASIC_BAND = 34_500;
	private static final long HIGHER_BAND = 103_650;

	@Override
	protected SolveResult<TaxReturnsOutput> doSolve(
		RoundEntity round,
		BombEntity bomb,
		ModuleEntity module,
		TaxReturnsInput input
	) {
		if(input == null) return failure("Input is required");
		if(!validAmounts(input.turnovers(), 12)) return failure("Enter all 12 monthly turnover figures");
		if(!validAmounts(input.expenses(), 36)) return failure("Enter all 36 expense figures");

		String surname = letter(input.surnameFirstLetter());
		String ni = letter(input.niLastLetter());
		if(surname == null) return failure("Surname first letter must be A-Z");
		if(ni == null) return failure("NI last letter must be A-Z");
		if(input.payrollLastDigit() == null || input.payrollLastDigit() < 0 || input.payrollLastDigit() > 9) {
			return failure("Payroll last digit must be between 0 and 9");
		}

		long grossTurnover = sum(input.turnovers());
		long grossExpenses = sum(input.expenses());
		long lit = BombEdgeworkUtils.getLitIndicatorCount(bomb);
		long unlit = BombEdgeworkUtils.getUnlitIndicatorCount(bomb);
		int pensionRate = lit + unlit == 0 ? 0 : lit > unlit ? 5 : unlit > lit ? 10 : 15;
		long pensionContribution = grossTurnover * pensionRate / 100;

		boolean surnameAtoM = surname.charAt(0) <= 'M';
		boolean niAorC = ni.equals("A") || ni.equals("C");
		boolean payrollOdd = input.payrollLastDigit() % 2 == 1;
		String portfolio = niAorC && surnameAtoM && payrollOdd ? "D"
			: niAorC && surnameAtoM ? "C"
			: niAorC && payrollOdd ? "F"
			: surnameAtoM && payrollOdd ? "E"
			: surnameAtoM ? "A"
			: payrollOdd ? "G"
			: niAorC ? "B" : "H";
		int portfolioValue = switch(portfolio) {
			case "A" -> 599;
			case "B" -> 1_241;
			case "C" -> 478;
			case "D" -> 932;
			case "E" -> 81;
			case "F" -> 736;
			case "G" -> 1_647;
			default -> 0;
		};
		long taxFreeInvestment = (long)portfolioValue * BombEdgeworkUtils.getDistinctPortTypeCount(bomb);
		long grossProfit = grossTurnover - grossExpenses - pensionContribution - taxFreeInvestment;
		long allowanceDeduction = Math.max(0, grossProfit - 100_000) / 2;
		long taxFreeAllowance = Math.max(0, 11_850 - allowanceDeduction);
		long taxableIncome = Math.max(0, grossProfit - taxFreeAllowance);
		long basicTax = Math.min(taxableIncome, BASIC_BAND) * 20 / 100;
		long aboveBasic = Math.max(0, taxableIncome - BASIC_BAND);
		long higherTax = Math.min(aboveBasic, HIGHER_BAND) * 40 / 100;
		long additionalTax = Math.max(0, aboveBasic - HIGHER_BAND) * 45 / 100;
		long incomeTax = basicTax + higherTax + additionalTax;

		long taxableNi = Math.max(0, grossTurnover - grossExpenses - 8_423);
		long standardNi = taxableNi < 37_927 ? taxableNi * 9 / 100 : 3_413;
		long excessNi = Math.max(0, taxableNi - 37_926) * 2 / 100;
		long nationalInsurance = standardNi + excessNi;

		storeState(module, "input", input);
		return success(new TaxReturnsOutput(
			grossTurnover,
			grossExpenses,
			pensionRate,
			pensionContribution,
			portfolio,
			taxFreeInvestment,
			grossProfit,
			taxFreeAllowance,
			incomeTax,
			nationalInsurance,
			incomeTax + nationalInsurance
		));
	}

	private static boolean validAmounts(List<Integer> values, int expectedSize) {
		return values != null && values.size() == expectedSize
			&& values.stream().allMatch(value -> value != null && value >= 0);
	}

	private static long sum(List<Integer> values) {
		return values.stream().mapToLong(Integer::longValue).sum();
	}

	private static String letter(String value) {
		if(value == null || !value.trim().matches("(?i)[a-z]")) return null;
		return value.trim().toUpperCase(Locale.ROOT);
	}
}
