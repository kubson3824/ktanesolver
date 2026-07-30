package ktanesolver.module.modded.regular.digitalroot;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.DIGITAL_ROOT,
	id = "digitalRoot",
	name = "Digital Root",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine whether the lower digit is the digital root of the three upper digits.",
	tags = {"modded", "regular", "math"}
)
public class DigitalRootSolver extends AbstractModuleSolver<DigitalRootInput, DigitalRootOutput> {
	@Override
	protected SolveResult<DigitalRootOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, DigitalRootInput input
	) {
		if (input == null || !valid(input.first()) || !valid(input.second())
			|| !valid(input.third()) || !valid(input.displayedRoot())) {
			return failure("All displayed numbers must be digits from 0 to 9");
		}

		int sum = input.first() + input.second() + input.third();
		int digitalRoot = sum > 9 ? sum / 10 + sum % 10 : sum;
		String button = input.displayedRoot() == digitalRoot ? "YES" : "NO";
		return success(new DigitalRootOutput(button, digitalRoot));
	}

	private static boolean valid(Integer value) {
		return value != null && value >= 0 && value <= 9;
	}
}
