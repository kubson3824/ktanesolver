package ktanesolver.module.modded.regular.pie;

import java.util.ArrayList;
import java.util.List;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

@Service
@ModuleInfo(
	type = ModuleType.PIE,
	id = "pieModule",
	name = "Pie",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Locate five displayed digits in pi and determine their press order",
	tags = {"numbers", "pi", "sequence"}
)
public class PieSolver extends AbstractModuleSolver<PieInput, PieOutput> {

	private static final String PI =
		"31415926535897932384" +
		"62643383279502884197" +
		"16939937510582097494" +
		"45923078164062862089" +
		"98628034825342117067" +
		"98214808651328230664" +
		"70938446095505822317" +
		"25359408128481117450" +
		"28410270193852110555" +
		"96446229489549303819" +
		"64428810975665933446" +
		"12847564823378678316" +
		"52712019091456485669" +
		"23460348610454326648" +
		"21339360726024914127" +
		"37245870066063155881" +
		"74881520920962829254" +
		"09171536436789259036" +
		"00113305305488204665" +
		"21384146951941511609" +
		"43305727036575959195" +
		"30921861173819326117" +
		"93105118548074462379" +
		"96274956735188575272" +
		"48912279381830119491";

	@Override
	protected SolveResult<PieOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, PieInput input
	) {
		if (input.digits() == null || !input.digits().matches("\\d{5}")) {
			return failure("Enter exactly five displayed digits");
		}

		int index = PI.indexOf(input.digits());
		if (index < 0) {
			return failure("The displayed digits do not occur in the first 500 digits of pi");
		}

		int position = index + 1;
		int x = (Integer.parseInt(input.digits()) + position) % 100;
		int y = input.digits().chars().map(digit -> digit - '0').sum() % 10;
		List<Integer> pressOrder = new ArrayList<>();
		if (isPrime(x)) pressOrder.add(1);
		if (x % 2 == y % 2) pressOrder.add(2);
		if (x % 3 == 0) pressOrder.add(3);
		if (y != 0 && x % y == 0) pressOrder.add(4);
		for (int button = 5; button >= 1; button--) {
			if (!pressOrder.contains(button)) pressOrder.add(button);
		}

		storeState(module, "input", input);
		storeState(module, "displayedDigits", input.digits().chars().map(digit -> digit - '0').boxed().toList());
		return success(new PieOutput(position, x, y, List.copyOf(pressOrder)));
	}

	private static boolean isPrime(int number) {
		if (number < 2) return false;
		for (int divisor = 2; divisor * divisor <= number; divisor++) {
			if (number % divisor == 0) return false;
		}
		return true;
	}
}
